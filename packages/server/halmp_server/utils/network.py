# Network configuration through NetworkManager (nmcli) and raspi-config.
# Commands are always argument lists, never shell strings: values coming from the API
# stay single arguments, whatever characters they hold. Functions that change the
# system raise ValueError on invalid input, and CalledProcessError if a command fails.
import json
import re
import subprocess
import uuid as uuidlib
from ipaddress import IPv4Address, IPv4Interface
from pathlib import Path

WIRED_INTERFACE = "eth0"
# Created by systemd/setup_network.sh
WIRED_PROFILE = "eth0"
WIFI_INTERFACE = "wlan0"
WIFI_CONNECTION_TYPE = "802-11-wireless"
# nmcli waits 90 s by default, too long for the web UI. With a rescan (up to 8 s), this has
# to stay below the client's timeout (WIFI_CONNECT_TIMEOUT_MS in Wifi.tsx).
WIFI_CONNECT_WAIT_S = "25"
NMCLI_TIMEOUT = 3
NMCLI_NOT_FOUND = 10
DEFAULT_HOSTNAME = "raspberrypi"
FACTORY_WIRED_IP = "192.168.1.2"
FACTORY_WIRED_NETMASK = "255.255.255.0"

HOSTNAME_LABEL = re.compile(r"[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?")


def _run(*command):
    return subprocess.run(command,
                          text=True,
                          check=True,
                          capture_output=True).stdout.strip()


def _require_string(value, name):
    if not isinstance(value, str):
        raise ValueError(f"{name} must be a string")
    if any(ord(c) < 32 or ord(c) == 127 for c in value):
        raise ValueError(f"{name} must not contain control characters")
    return value


# Wired

def get_wired_config():
    return {
        **_get_ipv4_config(("id", WIRED_PROFILE), WIRED_INTERFACE),
        "connected": _wired_has_carrier(),
    }


def _wired_has_carrier():
    return _run("nmcli", "-g", "WIRED-PROPERTIES.CARRIER", "device", "show",
                WIRED_INTERFACE) == "on"


# IPv4 settings, shared by wired and Wi-Fi

def _get_ipv4_config(profile, interface):
    """The address mode of a profile, given as ("id", name) or ("uuid", uuid), with
    the addresses it was configured with, or else those the interface has now."""
    # One line per field, an empty one when the field is unset
    method, configured_address, configured_gateway = (_run(
        "nmcli", "-g", "ipv4.method,ipv4.addresses,ipv4.gateway", "connection",
        "show", *profile).split("\n") + ["", ""])[:3]
    if method == "manual" and configured_address:
        # What was configured, so it still shows while the profile is down
        address = IPv4Interface(configured_address.split(",")[0].strip())
        ip_address, netmask = str(address.ip), str(address.netmask)
        gateway = configured_gateway
    else:
        ip_address, netmask = _get_current_address(interface)
        gateway = _get_current_gateway(interface)
    return {
        "DHCPorFixed": "DHCP" if method == "auto" else "Fixed IP",
        "ipAddress": ip_address,
        "netmask": netmask,
        "gateway": gateway,
    }


def _get_current_address(interface):
    links = json.loads(_run("ip", "-j", "-4", "addr", "show", interface))
    addresses = [
        IPv4Interface(f"{address['local']}/{address['prefixlen']}")
        for link in links for address in link.get("addr_info", [])
    ]
    if not addresses:
        return "", ""
    # A link-local address only matters when the interface has nothing else
    address = min(addresses, key=lambda a: a.ip.is_link_local)
    return str(address.ip), str(address.netmask)


def _get_current_gateway(interface):
    routes = json.loads(
        _run("ip", "-j", "-4", "route", "show", "default", "dev", interface))
    return next((route["gateway"] for route in routes if "gateway" in route),
                "")


def _set_wired_ipv4(method, addresses, gateway):
    has_carrier = _wired_has_carrier()
    if not has_carrier and _run("nmcli", "-g", "GENERAL.STATE", "connection",
                                "show", "id", WIRED_PROFILE):
        # Without a cable, DHCP can't be activated and an active fixed address would
        # stay. Deactivating blocks autoconnect until the profile is next modified, so
        # it comes first: the new settings then apply when a cable is plugged.
        _run("sudo", "nmcli", "connection", "down", "id", WIRED_PROFILE)
    _run("sudo", "nmcli", "connection", "modify", "id", WIRED_PROFILE,
         "ipv4.method", method, "ipv4.addresses", addresses, "ipv4.gateway",
         gateway)
    if has_carrier:
        # Doesn't wait: without a DHCP server, activation can last until nmcli
        # gives up (90 s), and a new address can cut off the client anyway
        _run("sudo", "nmcli", "--wait", "0", "connection", "up", "id",
             WIRED_PROFILE)


def set_wired_dhcp():
    # A gateway set here would replace the one given by the DHCP server
    _set_wired_ipv4("auto", "", "")


def set_wired_fixed(ip_address, netmask, gateway=""):
    """gateway is optional: an empty string means none."""
    _set_wired_ipv4("manual", *_parse_fixed_ipv4(ip_address, netmask, gateway))


def _parse_fixed_ipv4(ip_address, netmask, gateway):
    """Checks fixed IP settings, and returns the address with its prefix length and
    the gateway, empty for none, as nmcli takes them."""
    address = IPv4Address(_require_string(ip_address, "IP address"))
    if address.is_unspecified or address.is_multicast or address.is_loopback:
        raise ValueError(f"{address} can't be used as an IP address")
    interface = IPv4Interface(
        f"{address}/{_require_string(netmask, 'Netmask')}")
    gateway = _require_string(gateway, "Gateway").strip()
    if gateway:
        try:
            gateway_address = IPv4Address(gateway)
        except ValueError:
            raise ValueError("Incorrect gateway format") from None
        network = interface.network
        if gateway_address not in network:
            raise ValueError(
                f"Gateway {gateway_address} is outside the {network} network "
                f"set by the IP address and netmask")
        if gateway_address == address:
            raise ValueError(
                f"Gateway {gateway_address} can't be the player's own address")
        # /31 and /32 networks have no network or broadcast address
        if network.prefixlen < 31:
            if gateway_address == network.network_address:
                raise ValueError(
                    f"Gateway {gateway_address} is the network address of "
                    f"{network}, not a device")
            if gateway_address == network.broadcast_address:
                raise ValueError(
                    f"Gateway {gateway_address} is the broadcast address of "
                    f"{network}, not a device")
        gateway = str(gateway_address)
    return interface.with_prefixlen, gateway


# Wi-Fi

def connect_wifi(ssid, password, hidden, fixed_ipv4=None):
    """fixed_ipv4 is None for DHCP, or (ip_address, netmask, gateway), gateway
    being optional: an empty string means none."""
    _require_string(ssid, "SSID")
    _require_string(password, "Password")
    if not 1 <= len(ssid.encode()) <= 32:
        raise ValueError("SSID must be 1 to 32 bytes long")
    if not 8 <= len(password) <= 64:
        raise ValueError("Password must be 8 to 64 characters long")
    if not isinstance(hidden, bool):
        raise ValueError("Hidden must be true or false")
    if fixed_ipv4 is not None:
        fixed_ipv4 = _parse_fixed_ipv4(*fixed_ipv4)
    # With a profile already saved for this SSID, nmcli tries to update it and fails with
    # "802-11-wireless-security.key-mgmt: property is missing"
    _delete_wifi_profiles(ssid)
    try:
        if fixed_ipv4 is None:
            _connect_wifi_dhcp(ssid, password, hidden)
        else:
            _connect_wifi_fixed(ssid, password, hidden, *fixed_ipv4)
    except subprocess.CalledProcessError as e:
        # Don't keep a profile holding a password that doesn't work
        _delete_wifi_profiles(ssid)
        message = _wifi_connect_failure_message(e, ssid)
        if message:
            raise ValueError(message) from e
        raise


def _connect_wifi_dhcp(ssid, password, hidden):
    command = ("sudo", "nmcli", "--wait", WIFI_CONNECT_WAIT_S, "device", "wifi",
               "connect", ssid, "password", password, "hidden",
               "yes" if hidden else "no")
    try:
        _run(*command)
    except subprocess.CalledProcessError as e:
        if e.returncode != NMCLI_NOT_FOUND:
            raise
        # nmcli only looks at the latest scan, which can miss a network in range
        _rescan_wifi()
        _run(*command)


def _connect_wifi_fixed(ssid, password, hidden, addresses, gateway):
    # "device wifi connect" always sets up DHCP, and fails on a network without a
    # DHCP server before the address could be changed: the profile is made here.
    if hidden:
        # Not in the scan list, so there's nothing to tell WPA3 from WPA2
        key_mgmt = "wpa-psk"
    else:
        security = _get_wifi_security(ssid)
        if security is None:
            _rescan_wifi()
            security = _get_wifi_security(ssid)
        if security is None:
            raise ValueError(_wifi_not_found_message(ssid))
        # Like "device wifi connect": WPA2 when the network takes it, even alongside
        # WPA3, as some Wi-Fi chips don't do WPA3
        key_mgmt = "sae" if "WPA3" in security and not re.search(
            r"WPA[12]", security) else "wpa-psk"
    uuid = str(uuidlib.uuid4())
    _run("sudo", "nmcli", "connection", "add", "type", "wifi", "con-name", ssid,
         "connection.uuid", uuid, "ifname", WIFI_INTERFACE, "ssid", ssid,
         "802-11-wireless.hidden", "yes" if hidden else "no",
         "802-11-wireless-security.key-mgmt", key_mgmt,
         "802-11-wireless-security.psk", password, "ipv4.method", "manual",
         "ipv4.addresses", addresses, "ipv4.gateway", gateway)
    _run("sudo", "nmcli", "--wait", WIFI_CONNECT_WAIT_S, "connection", "up",
         "uuid", uuid)


def _get_wifi_security(ssid):
    """The security of a network in the latest scan, like "WPA2 WPA3", or None if it
    isn't there."""
    # No escaping: SECURITY is the last field, so an SSID holding a ":" still splits
    # right from the end
    for line in _run("nmcli", "--escape", "no", "-t", "-f", "SSID,SECURITY",
                     "device", "wifi", "list").splitlines():
        scanned_ssid, _, security = line.rpartition(":")
        if scanned_ssid == ssid:
            return security
    return None


def _rescan_wifi():
    try:
        # Waits for the scan to finish, unlike "device wifi rescan"
        _run("sudo", "nmcli", "-f", "SSID", "device", "wifi", "list", "--rescan",
             "yes")
    except subprocess.CalledProcessError as e:
        # Connecting again will report what's wrong
        print(f"Wi-Fi rescan failed: {e.stderr}")


def _wifi_connect_failure_message(error, ssid):
    """A clear message for the usual failures, or None to keep nmcli's own."""
    if error.returncode == NMCLI_TIMEOUT:
        return f"Timed out while connecting to {ssid}."
    if error.returncode == NMCLI_NOT_FOUND:
        return _wifi_not_found_message(ssid)
    # No exit code for this one. NetworkManager asks for a new password when the network
    # refuses the one given, and nmcli can't ask, as it isn't run interactively.
    stderr = error.stderr or ""
    if "Secrets were required" in stderr:
        return f"Could not connect to {ssid}: the network refused the password."
    # From "connection up", for a hidden network with a fixed IP
    if "network could not be found" in stderr:
        return _wifi_not_found_message(ssid)
    return None


def _wifi_not_found_message(ssid):
    return f"Wi-Fi network {ssid} not found. Check its name and that it is in range."


def _wifi_profile_uuids():
    lines = _run("nmcli", "-t", "-f", "TYPE,UUID", "connection",
                 "show").splitlines()
    return [
        uuid for connection_type, uuid in (line.split(":") for line in lines)
        if connection_type == WIFI_CONNECTION_TYPE
    ]


def _delete_wifi_profiles(ssid):
    for uuid in _wifi_profile_uuids():
        if _get_profile_ssid(uuid) == ssid:
            _run("sudo", "nmcli", "connection", "delete", "uuid", uuid)


def _get_profile_ssid(uuid):
    # No escaping: there is a single field, and an SSID can hold a ":"
    return _run("nmcli", "--escape", "no", "-g", "802-11-wireless.ssid",
                "connection", "show", "uuid", uuid)


def is_wifi_active():
    return _run("nmcli", "radio", "wifi") == "enabled"


def set_wifi_active(active):
    _run("sudo", "nmcli", "radio", "wifi", "on" if active else "off")


def get_current_wifi():
    """The SSID of the network the player is connected to, empty when none, and its
    IPv4 settings, those of a DHCP connection without address when there is none."""
    # Asks the active profile rather than the scan list, which may not name a hidden network
    for line in _run("nmcli", "-t", "-f", "TYPE,STATE,UUID", "connection",
                     "show", "--active").splitlines():
        connection_type, state, uuid = line.split(":")
        if connection_type == WIFI_CONNECTION_TYPE and state == "activated":
            return {
                "SSID": _get_profile_ssid(uuid),
                **_get_ipv4_config(("uuid", uuid), WIFI_INTERFACE),
            }
    return {
        "SSID": "",
        "DHCPorFixed": "DHCP",
        "ipAddress": "",
        "netmask": "",
        "gateway": "",
    }


def forget_known_wifis():
    """Forget all Wi-Fi profiles and turn Wi-Fi off."""
    set_wifi_active(False)
    # By UUID: profile names are usually SSIDs, which can hold spaces
    for uuid in _wifi_profile_uuids():
        _run("sudo", "nmcli", "connection", "delete", "uuid", uuid)


# Hostname

def get_hostname():
    return "".join(Path("/etc/hostname").read_text().split())


def set_hostname(hostname):
    _require_string(hostname, "Hostname")
    if len(hostname) > 253 or not all(
            HOSTNAME_LABEL.fullmatch(label) for label in hostname.split(".")):
        raise ValueError("Incorrect hostname format")
    _run("sudo", "raspi-config", "nonint", "do_hostname", hostname)
