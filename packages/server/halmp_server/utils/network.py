# Network configuration through NetworkManager (nmcli) and raspi-config.
# Commands are always argument lists, never shell strings: values coming from the API
# stay single arguments, whatever characters they hold. Functions that change the
# system raise ValueError on invalid input, and CalledProcessError if a command fails.
import json
import re
import subprocess
from ipaddress import IPv4Address, IPv4Interface, IPv4Network
from pathlib import Path

WIRED_INTERFACE = "eth0"
# Created by systemd/setup_network.sh
WIRED_PROFILE = "eth0"
WIFI_CONNECTION_TYPE = "802-11-wireless"
DEFAULT_HOSTNAME = "raspberrypi"

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
    method, _, configured_address = _run(
        "nmcli", "-g", "ipv4.method,ipv4.addresses", "connection", "show", "id",
        WIRED_PROFILE).partition("\n")
    if method == "manual" and configured_address:
        # What was configured, so it still shows while the cable is unplugged
        address = IPv4Interface(configured_address.split(",")[0].strip())
        ip_address, netmask = str(address.ip), str(address.netmask)
    else:
        ip_address, netmask = _get_current_address(WIRED_INTERFACE)
    return {
        "DHCPorFixed": "DHCP" if method == "auto" else "Fixed IP",
        "ipAddress": ip_address,
        "netmask": netmask,
        "connected": _wired_has_carrier(),
    }


def _wired_has_carrier():
    return _run("nmcli", "-g", "WIRED-PROPERTIES.CARRIER", "device", "show",
                WIRED_INTERFACE) == "on"


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


def _set_wired_ipv4(method, addresses):
    has_carrier = _wired_has_carrier()
    if not has_carrier and _run("nmcli", "-g", "GENERAL.STATE", "connection",
                                "show", "id", WIRED_PROFILE):
        # Without a cable, DHCP can't be activated and an active fixed address would
        # stay. Deactivating blocks autoconnect until the profile is next modified, so
        # it comes first: the new settings then apply when a cable is plugged.
        _run("sudo", "nmcli", "connection", "down", "id", WIRED_PROFILE)
    _run("sudo", "nmcli", "connection", "modify", "id", WIRED_PROFILE,
         "ipv4.method", method, "ipv4.addresses", addresses)
    if has_carrier:
        # Doesn't wait: without a DHCP server, activation can last until nmcli
        # gives up (90 s), and a new address can cut off the client anyway
        _run("sudo", "nmcli", "--wait", "0", "connection", "up", "id",
             WIRED_PROFILE)


def set_wired_dhcp():
    _set_wired_ipv4("auto", "")


def set_wired_fixed(ip_address, netmask):
    address = IPv4Address(_require_string(ip_address, "IP address"))
    if address.is_unspecified or address.is_multicast or address.is_loopback:
        raise ValueError(f"{address} can't be used as an IP address")
    prefix = IPv4Network(
        f"0.0.0.0/{_require_string(netmask, 'Netmask')}").prefixlen
    _set_wired_ipv4("manual", f"{address}/{prefix}")


# Wi-Fi

def connect_wifi(ssid, password, hidden):
    _require_string(ssid, "SSID")
    _require_string(password, "Password")
    if not 1 <= len(ssid.encode()) <= 32:
        raise ValueError("SSID must be 1 to 32 bytes long")
    if not 8 <= len(password) <= 64:
        raise ValueError("Password must be 8 to 64 characters long")
    if not isinstance(hidden, bool):
        raise ValueError("Hidden must be true or false")
    _run("sudo", "nmcli", "device", "wifi", "connect", ssid, "password",
         password, "hidden", "yes" if hidden else "no")


def is_wifi_active():
    return _run("nmcli", "radio", "wifi") == "enabled"


def set_wifi_active(active):
    _run("sudo", "nmcli", "radio", "wifi", "on" if active else "off")


def get_current_ssid():
    # Asks the active profile rather than the scan list, which may not name a hidden network
    for line in _run("nmcli", "-t", "-f", "TYPE,STATE,UUID", "connection",
                     "show", "--active").splitlines():
        connection_type, state, uuid = line.split(":")
        if connection_type == WIFI_CONNECTION_TYPE and state == "activated":
            # No escaping: there is a single field, and an SSID can hold a ":"
            return _run("nmcli", "--escape", "no", "-g", "802-11-wireless.ssid",
                        "connection", "show", "uuid", uuid)
    return ""


def forget_known_wifis():
    """Forget all Wi-Fi profiles and turn Wi-Fi off."""
    set_wifi_active(False)
    # By UUID: profile names are usually SSIDs, which can hold spaces
    for line in _run("nmcli", "-t", "-f", "TYPE,UUID", "connection",
                     "show").splitlines():
        connection_type, uuid = line.split(":")
        if connection_type == WIFI_CONNECTION_TYPE:
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
