# Porting HAL MediaPlayer from Raspberry Pi OS Bullseye to Trixie

Most of the risk comes from changes introduced in **Bookworm**; Trixie adds a few more on top.

The three big breaking changes:

1. **KMS is now the only display stack**: the legacy firmware display path (`hdmi_mode`, `sdtv_mode`, `vcgencmd display_power`) and MMAL are gone.
2. **The boot partition moved to `/boot/firmware`**: `/boot/config.txt` is now a "do not edit" stub.
3. **No more system-wide `pip install`** (PEP 668), and **no default `pi` user**.

> This roadmap started from reading the code and known Bookworm/Trixie changes. The Pi 5 is untested, as none is available for now.

---

## Decisions to make first

- [x] **Which Pi models to target.** → **Pi 3, Pi 4 and Pi 5**, all from one image. Pi 5 changes audio (no jack), video (no practical composite, no H.264 hardware decode) and the HandBrake preset, so every Pi 5 caveat below must be handled, not skipped. A single image for all three must be arm64 (Pi 5 is 64-bit only; Pi 3 runs arm64 fine but has only 1 GB RAM).
- [x] **Keep a `pi` user** in the image, or make all paths user-independent. → Keep `pi`: releases ship as a full OS image, so the user is part of the image.
- [x] **Composite video.** → **Not supported on Pi 5** (test pads only). **Must be fully supported on Pi 3 and Pi 4** (PAL and NTSC). See §2.
- [x] **HDMI on/off approach**, since there is no direct KMS equivalent (see §3). → Framebuffer blanking, see §3.

## Suggested order

1. Flash stock Trixie Lite and get VLC fullscreen playback and audio device selection working by hand (riskiest part, drives the config.txt/cmdline.txt redesign).
2. Paths and venv.
3. Networking.
4. USB mount.
5. Image-build README.

---

## 1. Video playback (VLC) — **large**

- [x] Bullseye VLC on the Pi used MMAL for decode and display. MMAL is gone. VLC now outputs straight to DRM/KMS on the console (probably `--vout=drm` or similar), with hardware decode through V4L2. The service user must be in the `video`/`render` groups.
- [x] Test on hardware early: frame pacing, the black-image-while-stopped trick, looping, and whether VLC keeps DRM master across media changes.
- [ ] **Pi 5 has no H.264 hardware decoder** (HEVC only). `HAL_Media_Player_H264_1080p.json` falls back to software decode on a Pi 5: probably OK at 1080p, not at 4K. Consider adding an HEVC preset.
- [x] `vlc_handler.py:32` uses `-A alsa`. That's fine on Lite (no PipeWire by default). Don't base the image on Desktop.

## 2. Video output setup / `config.txt` templates — **large**

- [x] **Path**: replace `/boot/config.txt` with `/boot/firmware/config.txt` in `http_api.py` (`setVideoOutput`, `getConfigTXT`, `sendConfigTXT`, `factory_reset`) and in the client label (`VideoSetup.tsx`). Server side done (`utils/boot_config.py`); client label still to do. The client label is tracked in §12.
- [x] **Legacy options are ignored under KMS**: `hdmi_group`, `hdmi_mode`, `hdmi_force_hotplug`, `sdtv_mode`, `hdmi_safe`, `overscan_*`, `framebuffer_*`, `hdmi_drive`, `config_hdmi_boost`, and mostly `gpu_mem`. Replacements:
  - **Forced 1080p60**: `video=HDMI-A-1:1920x1080M@60D` in `/boot/firmware/cmdline.txt`. The feature must now edit **cmdline.txt** too.
  - **Composite PAL/NTSC (Pi 3 and Pi 4 only)**: `dtoverlay=vc4-kms-v3d,composite`, plus `enable_tvout=1` on Pi 4 (off by default there). In cmdline.txt: `vc4.tv_norm=PAL` with `video=Composite-1:720x576@50ie`, or `vc4.tv_norm=NTSC` with `video=Composite-1:720x480@60ie`. Since one image serves all models, put the Pi-specific lines under `[pi3]` / `[pi4]` filters in config.txt.
  - [x] Templates rewritten as managed-block fragments in `resources/boot_configs/`: `common.txt` (every mode) and `composite.txt` (added for PAL/NTSC). HDMI modes need no config.txt lines; their differences are cmdline.txt values only. **To verify on hardware**: `composite.txt` loads `dtoverlay=vc4-kms-v3d,composite,nohdmi` a second time after the stock line.
  - **Composite is not supported on Pi 5.** The API (`setVideoOutput`) must refuse composite modes on Pi 5, and factory reset must never select composite there.
- [ ] **Composite must be solid on Pi 3 and Pi 4**: test PAL and NTSC on both models with a real CRT/composite display. Check the picture fills the screen correctly (overscan settings no longer apply under KMS; use the `margin_*` / `tv_mode` cmdline options if needed), that VLC plays interlaced output smoothly, and that audio output selection still works with composite active.
  - Point the doc links (templates and UI) to the KMS video docs instead of `legacy_config_txt`.
- [x] **Important**: the templates replace the whole `config.txt`. That silently drops the Bookworm/Trixie defaults: `dtoverlay=vc4-kms-v3d`, `auto_initramfs=1`, `arm_64bit=1`, `display_auto_detect`, `camera_auto_detect`, `arm_boost`, and the `[pi5]`/`[cm4]` sections. Without `auto_initramfs`, **overlayfs will not work**. Rebuild the templates from a stock Trixie `config.txt`, or better, edit only the managed lines instead of copying whole files.
  - [x] **Decision: managed block.** The server only rewrites the lines between the `# --- HALMP managed: begin/end ---` markers at the end of `config.txt` (`utils/boot_config.py`); everything else, including HiFiBerry overlays, is left as is. `cmdline.txt` is edited value by value, never replaced, since it holds the per-install `PARTUUID` and cloud-init id.
- [ ] **HiFiBerry**: after kernel 6.1.77, some overlays were renamed (for example `hifiberry-dacplus-std` / `-pro`). Update the list for kernel 6.12. The commented list of overlays was in the old templates; it now belongs in the image's `config.txt`, **outside** the managed block (see §13).

## 3. HDMI on/off — **done, Pi 4 and Pi 5 to verify**

- [x] `vcgencmd display_power` has no effect under KMS (it exits 0 anyway). Replaced: `hdmi_off` stops VLC so it closes its video output, then writes `4` to `/sys/class/graphics/fb0/blank`; `hdmi_on` writes `0` (`utils/hdmi_power.py`, `vlc_handler.py`). Blanking by hand with the server stopped cut the signal on Pi 3.
- [x] Playback is paused while HDMI is off. VLC really stops (it must, to release the display), so the position is saved. `hdmi_on` brings the media back paused at that position, or nothing if it was stopped; play is then needed to continue. Play, restart and upload (from the UI or OSC) turn HDMI back on by themselves. Stop leaves HDMI off and forgets the position. The state isn't kept across a reboot (HDMI is on after boot).
- [x] Verified: the full on/off cycle works.
- [ ] Check it again on Pi 4 and Pi 5 (Pi 5: check that `fb0` is still the display's framebuffer).
- Other options looked at: forcing the connector off through `/sys/class/drm/*/status` (probably doesn't cut the signal while VLC holds the display), DPMS on VLC's own DRM handle, CEC standby (signal stays on; could be an optional extra).

## 4. Audio output selection — **medium**

- [x] Under KMS, HDMI audio comes from `vc4-hdmi`, not `bcm2835 HDMI`, so the description matching in `vlc_handler.py` (`get_audio_outputs_list`) will never match. Card names become `vc4hdmi0` / `vc4hdmi1`.
- [x] vc4-hdmi only accepts IEC958, so a direct `hw:` device usually **fails**. Use `hdmi:CARD=vc4hdmi0` (or `default:`).
- [x] The headphone jack (`bcm2835 Headphones`) still exists on Pi 3 and 4. **Pi 5 has no analog jack**: its default is HDMI, including after a factory reset, and a `"jack"` setting found in `config.json` is changed to HDMI at startup.
- [ ] Verify the HDMI default and factory reset on a Pi 5.
- [x] `get_audio_outputs_list` matches on the ALSA device name instead of description strings: card id `Headphones` for the jack, an id containing `hifiberry` for HiFiBerry. USB cards are found through `/proc/asound/<id>/usbid`, since their id comes from the product name. The first USB card wins.
- [x] Verify on hardware: check the names with `aplay -L` and `ls /proc/asound/`, then select jack, HDMI, USB and HiFiBerry from the UI.

## 5. Networking (wired and Wi-Fi) — **small to medium**

**Decisions**
- [x] **Cloud-init stops managing the network**: `network: {config: disabled}` in `/etc/cloud/cloud.cfg.d/`, and no `network-config` seed in the image. Wi-Fi settings entered in Raspberry Pi Imager therefore won't apply.
- [x] **Factory wired address is the fixed IP `192.168.1.2` / `255.255.255.0`**, on new installs (`setup_network.sh`) and after a factory reset. It has no gateway or DNS, and no link-local fallback, so a laptop needs an address on `192.168.1.x` to reach the player.
- [x] **Wi-Fi country is `FR` for now**: `raspi-config nonint do_wifi_country FR` in the image (Wi-Fi stays rfkill-blocked until a country is set). Cloud-init sets it today through `regulatory-domain`, so this has to replace it.

**Server endpoints** (`utils/network.py`)
- [x] `nmcli`, `ip` and `raspi-config` run from argument lists, without a shell. Fixes the shell injection in `setWifiConfig`, `setHostname` and `setWiredNetwokConfig`. All inputs are validated on the server (invalid input returns a 400).
- [x] `ifconfig` and `iwgetid` are replaced by `ip -j` and `nmcli`. Both tools were only present on the dev Pi because `net-tools` and `wireless-tools` were installed by hand.
- [x] SSIDs with spaces or `:` work in `getCurrentWifi`. `forget_known_wifis` deletes by UUID, so a name with a space no longer aborts it or factory reset.
- [x] Reconnecting to a saved Wi-Fi network failed with `key-mgmt: property is missing`, because `nmcli device wifi connect` tries to update the existing profile. `connect_wifi` now deletes any profile for that SSID first, and removes the new one if the connection fails.
- [x] A network in range could be reported as not found, because `nmcli` only looks at the latest scan and a scan can miss networks. `connect_wifi` now rescans and tries once more in that case.
- [x] The wired address lookup prefers a real address over a link-local one when the interface has both.
- [ ] Verify on hardware through the real server: Wi-Fi forget and factory reset. Wi-Fi connect and wired changes are verified.

**Install and image** (`systemd/setup_network.sh`, run by `install_service.sh`)
- [x] **`eth0` profile**: stock images create "Wired connection 1", and the code expects `eth0`. The script creates a single `eth0` profile on the factory fixed IP and deletes the other wired profiles. Re-running it keeps the DHCP or fixed IP choice.
- [x] **Link-local fallback in DHCP mode**: `ipv4.link-local fallback` (NetworkManager 1.52 or later). The former `enabled` added a 169.254.x.x address *alongside* the DHCP or fixed one.
- [x] **No cable**: `nmcli con up` refuses DHCP without a cable, but activates a fixed IP. Wired changes without a cable now deactivate the profile, then save the settings, which apply when a cable is plugged (modifying the profile last clears the autoconnect block that deactivating sets). A fixed IP shows the configured address even while unplugged.
- [x] `nmcli con up` no longer waits for activation, since it can take up to 90 s without a DHCP server. Failures after the request (like no DHCP answer) no longer report an error.
- [x] Cloud-init network config is disabled and the Wi-Fi country is set by the script. The raspi-config step is gone from the README.
- [x] **Verified with a cable**: DHCP; no DHCP server (169.254.x.x appears, and only then); fixed IP; settings changed while unplugged apply on plug-in, for both DHCP and fixed IP.
- [x] `netplan` doesn't recreate profiles on boot now that cloud-init's network config is disabled.
- [ ] **Release image must hold no Wi-Fi credentials**: remove the `network-config` seed from `/boot/firmware` (it holds a password in clear text), the Wi-Fi profiles in `/etc/NetworkManager/system-connections/`, and leftover `/etc/netplan/90-NM-*.yaml` files.

**Web client**
- [x] **Request timeout**: connecting to Wi-Fi now has a 35 s client timeout and a 25 s `nmcli` limit, instead of 4 s and 90 s. The Apply button shows progress, and losing contact (the player moved to the new network) shows a warning instead of an error.
- [x] **IP change**: when the page uses the wired IP and the address changes, a dialog links to the new address, or explains how to find it after a switch to DHCP.
- [ ] Verify both on hardware, with the new client (§12).

## 6. Read-only filesystem (overlayfs) — **small to medium**

- [x] `raspi-config nonint enable_overlayfs`, `get_overlay_now` and `disable_overlayfs` still exist but now depend on the initramfs (see the `auto_initramfs` point in §2). Verified: the read-only overlay works.
- [x] **Decision: /boot is no longer read-only.** Nothing writes to it during playback, and `do_overlayfs 0` set `ro` in `/etc/fstab` that `disable_overlayfs` never removed, which left the Setup and Network pages locked. The server now calls `enable_overlayfs` and refuses `/boot` writes while the overlay is active.
- [ ] **Release image**: `/etc/fstab` must have `defaults,noatime` for `/boot/firmware`, without `ro`.
- [x] New on Trixie: `/tmp` is a tmpfs by default. No impact, since uploads go to the app's `media/` folder.

## 7. USB import — **done**

- [x] `usbmount` is replaced by `systemd/99-halmp-usb-mount.rules`: a udev rule that runs `systemd-mount` (udevd's private mount namespace rules out mounting from the rule directly). Each USB partition is mounted read-only in `/media/usb-<partition>`, and the server searches all of them.
- [x] exFAT is supported natively by the kernel: `exfat-fuse` and `exfat-utils` aren't needed.
- [x] Fixed: `volumes_list.__len__ == 0` was always False, and a failed `rsync` could be reported as a success.
- [x] Only files with an accepted extension are picked, and extensions are now matched ignoring case (`CLIP.MP4`).
- **Decision: the old media file is deleted before the copy starts**, so a very large file doesn't need room for both. A failed copy leaves the player without media.
- [x] Verified on hardware: FAT32 and exFAT drives, accented file names, unplugging the drive, a drive already plugged in at boot.

## 8. Python runtime, services and install — **medium (mostly image build)**

- [x] **PEP 668**: system-wide `pip install` is refused, so the README's `pip install eventlet` / `dnspython` steps are dead. `pyproject.toml` + `uv.lock` + `.python-version` 3.13 already exist, and **Trixie ships Python 3.13**. Run both servers from venvs with `ExecStart=/home/<user>/…/.venv/bin/python -m …`. The bare `python` command doesn't exist without `python-is-python3`.
- [ ] Give the OSC server a `pyproject.toml`. It already runs from a venv, created from `requirements.txt` by `install_service.sh`.
- [ ] System packages still needed: `vlc` / `libvlc`, `libmagic1t64` (the Trixie name of `libmagic1`), `rsync`. To list in the README (§13).
- [x] **No default `pi` user.** `/home/pi` is hard-coded in both units, in `shutil.disk_usage("/home/pi")` (`getAvailableSpace`, `getFSSize`). Either create `pi` when building the image, or make paths relative to the app or `Path.home()`. → Keep `pi`, created in the image, so the hard-coded paths stay.
- [x] Add an explicit `/etc/sudoers.d/halmp` for `nmcli`, `raspi-config`, `reboot`, `shutdown` and `cp`, instead of relying on the default user's NOPASSWD entry.
- [x] **authbind** still works, but `AmbientCapabilities=CAP_NET_BIND_SERVICE` in the unit is cleaner and removes a dependency. The unit uses `AmbientCapabilities`. The README still has the old authbind section (see §13).
- [x] Unit file bugs, independent of the port:
  - `halmp.service` uses `WantedBy=graphical.target`, but Lite boots to `multi-user.target`.
  - The OSC unit runs `python -m halmp-OSCserver`, but the package is `halmp_OSCserver`.
  - The OSC server reads `REACT_APP_SERVER_PORT`, the main server uses `VITE_SERVER_PORT`.
  - Unit files are duplicated in `RPi Install/` and `packages/server/halmp_server/systemd/`: keep one.

## 9. Console blanking / black screen — **done**

- [x] **Decision: boot messages stay visible until the player starts**, then the screen goes black. So no `quiet`, `loglevel=3`, `logo.nologo` or similar in `cmdline.txt`, since those hide messages from the start of boot.
- [x] `black_shell.service` starts right after `halmp.service` and switches to an empty console (`chvt 7`). Boot output and the login prompt go to `tty1` (`console=tty1`), so they stay hidden behind it, including what cloud-init prints long after the server starts. It switches back to `tty1` when stopped, so shutdown messages are visible. Alt+F1 with a keyboard reaches the login prompt.
- [x] `blank_console()` is removed: painting the console black had to be repeated whenever later boot output overwrote it.
- [x] Verified on hardware: black at startup with no media, no login prompt on `tty7`, black during the stop and HDMI handovers, shutdown messages visible.
- **Decision: undervoltage warnings move to the WebUI.** `black_shell.service` keeps kernel messages off the screen (`dmesg -n 1`). So users still notice an unsuitable power supply, the server watches the kernel's undervoltage alarm and the WebUI shows a toast each time it is raised.
- [ ] Keep the `kbd` package in the image (it provides `chvt`).

## 10. Filesystem expand / first-boot resize — **small**

- [x] **The old `rc.local` + `/home/pi/resize_done` mechanism is removed** (README snippet and the flag cleanup in `factory_reset`). First-boot expansion is now done by the separate macOS/Windows image tool, which shrinks the release image and installs a one-off systemd unit that expands the filesystem.
- [ ] Keep the manual "Expand File System" button as a fallback: check that `raspi-config nonint do_expand_rootfs` still works on Trixie.

## 11. Hostname, reboot/shutdown, volume/delay, OSC, HTTP API — **little or nothing**

- [x] `raspi-config nonint do_hostname` still works. Check that cloud-init doesn't reapply the Imager hostname on reboot (`preserve_hostname: true`). Verified: a hostname set from the UI survives a reboot.
- Flask, Socket.IO and python-osc are unaffected apart from the venv change.

## 12. Web client — **rewritten in Svelte, to verify on hardware**

`packages/client` was rewritten from scratch (Svelte 5, Vite, Tailwind, shadcn-svelte). Tested in a browser against a mock of the API, and read-only against a real player. The actions that change something have not been run on hardware yet.

**Setup, video**
- [x] "Edit /boot/firmware/config.txt" button, and the doc link now points to the KMS docs.
- [x] The text above the buttons says they only rewrite the managed block of `config.txt` and the video values of `cmdline.txt`.
- [x] Composite PAL / NTSC hidden on Pi 5.
- [x] The raw editor only covers `config.txt`, and says that `cmdline.txt` exists and why it isn't editable.
- [ ] Show the current video mode, if wanted (nothing reports it today; it can be read from the managed block and `cmdline.txt`).

**Setup, audio**
- [x] HiFiBerry note points to `/boot/firmware/config.txt`.
- [x] "Headphone jack" hidden on Pi 5.
- [x] The default audio output isn't `"jack"` on Pi 5, including after a factory reset (see §4). Server side.

**New server endpoint**
- [x] `GET /api/getPiModel`, returning `pi3` / `pi4` / `pi5` / `unknown`. Needs a server update on the player for the Pi 5 options to hide: until then, the client shows everything.

**Other**
- [x] "Expand file system" button and text kept, as the manual fallback (§10).
- [x] Built files land in `halmp_server/static/`.
- [ ] Run on a player: upload, USB copy, seek, Wi-Fi and wired changes, read-only mode, reboot, factory reset.

## 13. README / image build

- [ ] Rewrite the "Install RPi" section for Trixie Lite: apt packages, uv/venv, NetworkManager profiles, USB mount replacement, sudoers, systemd units, cloud-init settings. Remove the old `pip install` and authbind sections.
