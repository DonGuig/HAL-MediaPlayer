#!/usr/bin/env bash
# Run as the pi user (not with sudo): creates the venvs, installs the sudoers rules and the systemd units.
set -euo pipefail

SYSTEMD_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SYSTEMD_DIR/../../../.." && pwd)"
UNITS=(halmp.service halmp-OSCserver.service)

if [ "$(id -u)" -eq 0 ]; then
    echo "Run this script as the pi user, not as root." >&2
    exit 1
fi

export PATH="$HOME/.local/bin:$PATH"
command -v uv >/dev/null || { echo "uv not found: install it first (https://docs.astral.sh/uv/)" >&2; exit 1; }

# Python environments used by the units
(cd "$PROJECT_DIR/packages/server" && uv sync --frozen)
(cd "$PROJECT_DIR/packages/OSCserver" && uv venv --allow-existing && uv pip install -r requirements.txt)

# Scoped sudo rights for the server; validated first so a bad file can't break sudo
sudo visudo -c -f "$SYSTEMD_DIR/halmp.sudoers"
sudo install -m 440 "$SYSTEMD_DIR/halmp.sudoers" /etc/sudoers.d/halmp

for unit in "${UNITS[@]}"; do
    sudo install -m 644 "$SYSTEMD_DIR/$unit" /etc/systemd/system/
done

sudo systemctl daemon-reload
sudo systemctl enable "${UNITS[@]}"
# restart rather than start, so a re-run applies updated units and code
sudo systemctl restart "${UNITS[@]}"
