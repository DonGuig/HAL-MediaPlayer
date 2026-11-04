#!/usr/bin/env bash
# Network setup for the player, run by install_service.sh. Safe to re-run: settings
# chosen in the web UI (DHCP or fixed IP) and Wi-Fi profiles are kept.
set -euo pipefail

SYSTEMD_DIR="$(cd "$(dirname "$0")" && pwd)"
WIFI_COUNTRY=FR

# NetworkManager owns the network, not cloud-init/netplan
if [ -d /etc/cloud/cloud.cfg.d ]; then
    sudo install -m 644 "$SYSTEMD_DIR/99-halmp-disable-network.cfg" /etc/cloud/cloud.cfg.d/
fi

# Wi-Fi stays rfkill-blocked until a country is set
sudo raspi-config nonint do_wifi_country "$WIFI_COUNTRY"

# The single wired profile expected by the server (utils/network.py). A new profile starts
# on the factory fixed IP, the same as a factory reset (FACTORY_WIRED_IP in utils/network.py).
# The DHCP settings apply when DHCP is selected in the web UI: link-local (169.254.x.x)
# address when no other address is set.
if nmcli -g connection.uuid connection show id eth0 >/dev/null 2>&1; then
    sudo nmcli connection modify id eth0 \
        connection.interface-name eth0 connection.autoconnect yes connection.autoconnect-priority 100 \
        ipv4.link-local fallback ipv4.dhcp-timeout infinity ipv4.may-fail yes
else
    sudo nmcli connection add type ethernet ifname eth0 con-name eth0 \
        connection.autoconnect-priority 100 \
        ipv4.method manual ipv4.addresses 192.168.1.2/24 \
        ipv4.link-local fallback ipv4.dhcp-timeout infinity ipv4.may-fail yes
fi

# Remove the other wired profiles ("Wired connection 1", netplan-*), so only eth0 can
# take the interface
eth0_uuid="$(nmcli -g connection.uuid connection show id eth0)"
nmcli -t -f TYPE,UUID connection show | while IFS=: read -r type uuid; do
    if [ "$type" = "802-3-ethernet" ] && [ "$uuid" != "$eth0_uuid" ]; then
        sudo nmcli connection delete uuid "$uuid"
    fi
done
