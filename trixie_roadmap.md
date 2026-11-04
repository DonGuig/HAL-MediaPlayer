# Porting HAL MediaPlayer from Raspberry Pi OS Bullseye to Trixie

Most of the risk comes from changes introduced in **Bookworm**; Trixie adds a few more on top.

The three big breaking changes:

1. **KMS is now the only display stack**: the legacy firmware display path (`hdmi_mode`, `sdtv_mode`, `vcgencmd display_power`) and MMAL are gone.
2. **The boot partition moved to `/boot/firmware`**: `/boot/config.txt` is now a "do not edit" stub.
3. **No more system-wide `pip install`** (PEP 668), and **no default `pi` user**.

> This roadmap is based on reading the code and on known Bookworm/Trixie changes. Nothing has been tested on hardware yet. Least certain points: Trixie cloud-init/netplan behavior, exact VLC DRM vout flags, current state of raspi-config's boot-read-only functions.

---

## Decisions to make first

- [x] **Which Pi models to target.** → **Pi 3, Pi 4 and Pi 5**, all from one image. Pi 5 changes audio (no jack), video (no practical composite, no H.264 hardware decode) and the HandBrake preset, so every Pi 5 caveat below must be handled, not skipped. A single image for all three must be arm64 (Pi 5 is 64-bit only; Pi 3 runs arm64 fine but has only 1 GB RAM).
- [x] **Keep a `pi` user** in the image, or make all paths user-independent. → Keep `pi`: releases ship as a full OS image, so the user is part of the image.
- [x] **Composite video.** → **Not supported on Pi 5** (test pads only). **Must be fully supported on Pi 3 and Pi 4** (PAL and NTSC). See §2.
- [ ] **HDMI on/off approach**, since there is no direct KMS equivalent (see §3).

## Suggested order

1. Flash stock Trixie Lite and get VLC fullscreen playback and audio device selection working by hand (riskiest part, drives the config.txt/cmdline.txt redesign).
2. Paths and venv.
3. Networking.
4. USB mount.
5. Image-build README.

---

## 1. Video playback (VLC) — **large**

- [ ] Bullseye VLC on the Pi used MMAL for decode and display. MMAL is gone. VLC now outputs straight to DRM/KMS on the console (probably `--vout=drm` or similar), with hardware decode through V4L2. The service user must be in the `video`/`render` groups.
- [ ] Test on hardware early: frame pacing, the black-image-while-stopped trick, looping, and whether VLC keeps DRM master across media changes.
- [ ] **Pi 5 has no H.264 hardware decoder** (HEVC only). `HAL_Media_Player_H264_1080p.json` falls back to software decode on a Pi 5: probably OK at 1080p, not at 4K. Consider adding an HEVC preset.
- [ ] `vlc_handler.py:32` uses `-A alsa`. That's fine on Lite (no PipeWire by default). Don't base the image on Desktop.

## 2. Video output setup / `config.txt` templates — **large**

- [ ] **Path**: replace `/boot/config.txt` with `/boot/firmware/config.txt` in `http_api.py` (`setVideoOutput`, `getConfigTXT`, `sendConfigTXT`, `factory_reset`) and in the client label (`VideoSetup.tsx`). Server side done (`utils/boot_config.py`); client label still to do.
- [ ] **Legacy options are ignored under KMS**: `hdmi_group`, `hdmi_mode`, `hdmi_force_hotplug`, `sdtv_mode`, `hdmi_safe`, `overscan_*`, `framebuffer_*`, `hdmi_drive`, `config_hdmi_boost`, and mostly `gpu_mem`. Replacements:
  - **Forced 1080p60**: `video=HDMI-A-1:1920x1080M@60D` in `/boot/firmware/cmdline.txt`. The feature must now edit **cmdline.txt** too.
  - **Composite PAL/NTSC (Pi 3 and Pi 4 only)**: `dtoverlay=vc4-kms-v3d,composite`, plus `enable_tvout=1` on Pi 4 (off by default there). In cmdline.txt: `vc4.tv_norm=PAL` with `video=Composite-1:720x576@50ie`, or `vc4.tv_norm=NTSC` with `video=Composite-1:720x480@60ie`. Since one image serves all models, put the Pi-specific lines under `[pi3]` / `[pi4]` filters in config.txt.
  - [x] Templates rewritten as managed-block fragments in `resources/boot_configs/`: `common.txt` (every mode) and `composite.txt` (added for PAL/NTSC). HDMI modes need no config.txt lines; their differences are cmdline.txt values only. **To verify on hardware**: `composite.txt` loads `dtoverlay=vc4-kms-v3d,composite,nohdmi` a second time after the stock line.
  - **Composite is not supported on Pi 5.** The API (`setVideoOutput`) must refuse composite modes on Pi 5, and factory reset must never select composite there.
- [ ] **Composite must be solid on Pi 3 and Pi 4**: test PAL and NTSC on both models with a real CRT/composite display. Check the picture fills the screen correctly (overscan settings no longer apply under KMS; use the `margin_*` / `tv_mode` cmdline options if needed), that VLC plays interlaced output smoothly, and that audio output selection still works with composite active.
  - Point the doc links (templates and UI) to the KMS video docs instead of `legacy_config_txt`.
- [ ] **Important**: the templates replace the whole `config.txt`. That silently drops the Bookworm/Trixie defaults: `dtoverlay=vc4-kms-v3d`, `auto_initramfs=1`, `arm_64bit=1`, `display_auto_detect`, `camera_auto_detect`, `arm_boost`, and the `[pi5]`/`[cm4]` sections. Without `auto_initramfs`, **overlayfs will not work**. Rebuild the templates from a stock Trixie `config.txt`, or better, edit only the managed lines instead of copying whole files.
  - [x] **Decision: managed block.** The server only rewrites the lines between the `# --- HALMP managed: begin/end ---` markers at the end of `config.txt` (`utils/boot_config.py`); everything else, including HiFiBerry overlays, is left as is. `cmdline.txt` is edited value by value, never replaced, since it holds the per-install `PARTUUID` and cloud-init id.
- [ ] **HiFiBerry**: after kernel 6.1.77, some overlays were renamed (for example `hifiberry-dacplus-std` / `-pro`). Update the list for kernel 6.12. The commented list of overlays was in the old templates; it now belongs in the image's `config.txt`, **outside** the managed block (see §13).

## 3. HDMI on/off — **implemented, to verify**

- [x] `vcgencmd display_power` has no effect under KMS (it exits 0 anyway). Replaced: `hdmi_off` stops VLC so it closes its video output, then writes `4` to `/sys/class/graphics/fb0/blank`; `hdmi_on` writes `0` (`utils/hdmi_power.py`, `vlc_handler.py`). Blanking by hand with the server stopped cut the signal on Pi 3.
- [ ] Playback is paused while HDMI is off. VLC really stops (it must, to release the display), so the position is saved. `hdmi_on` brings the media back paused at that position, or the black image if it was stopped; play is then needed to continue. Play, restart and upload (from the UI or OSC) turn HDMI back on by themselves. Stop leaves HDMI off and forgets the position. The state isn't kept across a reboot (HDMI is on after boot).
- [ ] Verify the full cycle through the API on Pi 3, 4 and 5 (Pi 5 is untested: check that `fb0` is still the display's framebuffer).
- Other options looked at: forcing the connector off through `/sys/class/drm/*/status` (probably doesn't cut the signal while VLC holds the display), DPMS on VLC's own DRM handle, CEC standby (signal stays on; could be an optional extra).

## 4. Audio output selection — **medium**

- [ ] Under KMS, HDMI audio comes from `vc4-hdmi`, not `bcm2835 HDMI`, so the description matching in `vlc_handler.py` (`get_audio_outputs_list`) will never match. Card names become `vc4hdmi0` / `vc4hdmi1`.
- [ ] vc4-hdmi only accepts IEC958, so a direct `hw:` device usually **fails**. Use `hdmi:CARD=vc4hdmi0` (or `default:`).
- [ ] The headphone jack (`bcm2835 Headphones`) still exists on Pi 3 and 4. **Pi 5 has no analog jack**: the `"jack"` default in `config.json` and factory reset needs a fallback.
- [ ] Rewrite `get_audio_outputs_list` to match on the ALSA card id (`Headphones`, `vc4hdmi0`, `sndrpihifiberry`, `USB`) instead of description strings.

## 5. Networking (wired and Wi-Fi) — **small to medium**

- [ ] NetworkManager is the default now: remove the README step that switches to it through raspi-config.
- [ ] **Profile names differ.** Stock images create "Wired connection 1". Trixie images customized with Raspberry Pi Imager go through cloud-init and netplan, which creates `netplan-*` profiles. The code assumes a profile named `eth0`, so the image build must still delete the default and create `eth0` / `eth0-ll`. Check that cloud-init/netplan doesn't recreate its profile on boot (or disable cloud-init's network config).
- [ ] **`ifconfig` is no longer installed** (net-tools), which breaks the netmask lookup in `getWiredNetwokConfig`. Use `ip -o -f inet addr show eth0` or `nmcli -g IP4.ADDRESS dev show eth0`.
- [ ] **`iwgetid` is gone** (wireless-tools), which breaks `getCurrentWifi`. Use `nmcli -t -f active,ssid dev wifi | grep '^yes'` or `iw dev wlan0 link`.
- [ ] Wi-Fi stays rfkill-blocked until a country is set: `raspi-config nonint do_wifi_country FR` in the image.
- [ ] Unrelated to the port, but worth fixing while there: `setWifiConfig` and `setHostname` build shell strings without quoting. SSIDs or passwords with spaces or quotes break them, and it's a shell-injection risk. Switch to argument lists with `shell=False`.

## 6. Read-only filesystem (overlayfs) — **small to medium**

- [ ] `raspi-config nonint enable_overlayfs`, `get_overlay_now` and `disable_overlayfs` still exist but now depend on the initramfs (see the `auto_initramfs` point in §2).
- [x] **Decision: /boot is no longer read-only.** Nothing writes to it during playback, and `do_overlayfs 0` set `ro` in `/etc/fstab` that `disable_overlayfs` never removed, which left the Setup and Network pages locked. The server now calls `enable_overlayfs` and refuses `/boot` writes while the overlay is active.
- [ ] **Release image**: `/etc/fstab` must have `defaults,noatime` for `/boot/firmware`, without `ro`.
- [ ] New on Trixie: `/tmp` is a tmpfs by default. No impact, since uploads go to the app's `media/` folder.

## 7. USB import — **medium**

- [ ] `usbmount` has been unmaintained for years. Since `systemd-udevd` runs in a private mount namespace, mounts made from a udev `RUN` rule are invisible to the rest of the system unless the udevd unit is patched. Replace it with a small udev rule plus `systemd-mount --no-block --collect $devnode /media/usb`, or with udisks2 and a small watcher.
- [ ] exFAT is supported natively by the kernel: `exfat-fuse` isn't needed, and `exfat-utils` is replaced by `exfatprogs`.
- [ ] Existing bug: `volumes_list.__len__ == 0` in `getFileFromUSBDrive` is always False.

## 8. Python runtime, services and install — **medium (mostly image build)**

- [ ] **PEP 668**: system-wide `pip install` is refused, so the README's `pip install eventlet` / `dnspython` steps are dead. `pyproject.toml` + `uv.lock` + `.python-version` 3.13 already exist, and **Trixie ships Python 3.13**. Run both servers from venvs with `ExecStart=/home/<user>/…/.venv/bin/python -m …`. The bare `python` command doesn't exist without `python-is-python3`.
- [ ] Give the OSC server a `pyproject.toml` / venv as well (it only has `requirements.txt`).
- [ ] System packages still needed: `vlc` / `libvlc`, `libmagic1`, `rsync`.
- [ ] **No default `pi` user.** `/home/pi` is hard-coded in both units, in `shutil.disk_usage("/home/pi")` (`getAvailableSpace`, `getFSSize`). Either create `pi` when building the image, or make paths relative to the app or `Path.home()`.
- [x] Add an explicit `/etc/sudoers.d/halmp` for `nmcli`, `raspi-config`, `reboot`, `shutdown` and `cp`, instead of relying on the default user's NOPASSWD entry.
- [ ] **authbind** still works, but `AmbientCapabilities=CAP_NET_BIND_SERVICE` in the unit is cleaner and removes a dependency.
- [ ] Unit file bugs, independent of the port:
  - `halmp.service` uses `WantedBy=graphical.target`, but Lite boots to `multi-user.target`.
  - The OSC unit runs `python -m halmp-OSCserver`, but the package is `halmp_OSCserver`.
  - The OSC server reads `REACT_APP_SERVER_PORT`, the main server uses `VITE_SERVER_PORT`.
  - Unit files are duplicated in `RPi Install/` and `packages/server/halmp_server/systemd/`: keep one.

## 9. Console blanking / black screen — **done, to verify**

- [x] **Decision: boot messages stay visible until the player starts**, then the screen goes black. So no `quiet`, `loglevel=3`, `logo.nologo` or similar in `cmdline.txt`, since those hide messages from the start of boot.
- [x] `black_shell.service` starts right after `halmp.service` and switches to an empty console (`chvt 7`). Boot output and the login prompt go to `tty1` (`console=tty1`), so they stay hidden behind it, including what cloud-init prints long after the server starts. It switches back to `tty1` when stopped, so shutdown messages are visible. Alt+F1 with a keyboard reaches the login prompt.
- [x] `blank_console()` is removed: painting the console black had to be repeated whenever later boot output overwrote it.
- [ ] Verify on hardware: black at startup with no media, no login prompt on `tty7`, black during the stop and HDMI handovers, shutdown messages visible.
- [ ] Keep the `kbd` package in the image (it provides `chvt`).

## 10. Filesystem expand / first-boot resize — **small**

- [x] **The old `rc.local` + `/home/pi/resize_done` mechanism is removed** (README snippet and the flag cleanup in `factory_reset`). First-boot expansion is now done by the separate macOS/Windows image tool, which shrinks the release image and installs a one-off systemd unit that expands the filesystem.
- [ ] Keep the manual "Expand File System" button as a fallback: check that `raspi-config nonint do_expand_rootfs` still works on Trixie.

## 11. Hostname, reboot/shutdown, volume/delay, OSC, HTTP API — **little or nothing**

- [ ] `raspi-config nonint do_hostname` still works. Check that cloud-init doesn't reapply the Imager hostname on reboot (`preserve_hostname: true`).
- Flask, Socket.IO and python-osc are unaffected apart from the venv change.

## 12. Web client — **small, postponed**

Server side is done for video (`utils/boot_config.py`), so the client work is left for later. To do, all in `packages/client/src/content/`:

**`Setup/VideoSetup.tsx`**
- [ ] Rename the "Edit /boot/config.txt" button (line ~202) to `/boot/firmware/config.txt`.
- [ ] Replace the `legacy_config_txt` doc link (line ~87) with the KMS docs: https://www.raspberrypi.com/documentation/computers/config_txt.html
- [ ] Update the text above the buttons: they no longer remove all manual customization. They only rewrite the HALMP managed block of `config.txt` and the `video=` / `vc4.tv_norm=` values in `cmdline.txt`. HiFiBerry and other manual edits outside the block are kept.
- [ ] Hide the Composite PAL / NTSC buttons on Pi 5 (the server already refuses them).
- [ ] The raw editor only covers `config.txt`. Keep `cmdline.txt` out of it (a bad edit makes the Pi unbootable), but tell the user it exists, or show it read-only.
- [ ] Show the current video mode, if wanted (nothing reports it today; it can be read from the managed block and `cmdline.txt`).

**`Setup/AudioSetup.tsx`**
- [ ] Fix the HiFiBerry tooltip (line ~84): "Remember to edit /boot/firmware/config.txt below".
- [ ] Hide the "Headphone Jack" option on Pi 5, and make sure the default audio output isn't `"jack"` there (see §4).

**`Setup/index.tsx` and `Network/index.tsx`**
- [ ] Update the "read-only /boot" label (line ~28 in both) to say `/boot/firmware`, if the wording refers to the path.

**New server endpoint (needed by the above)**
- [ ] Report the Pi model to the client (for example `GET /api/getPiModel`, returning `pi3` / `pi4` / `pi5`), using `is_pi5()` in `utils/boot_config.py` or reading `/proc/device-tree/compatible`.

**Other**
- [ ] `System/FileSystem.tsx` and `About/index.tsx`: the "Expand File System" button and text stay, as the manual fallback (§10).
- [ ] Rebuild the client and check that the built files land in `halmp_server/static/` (the server serves them from there).

## 13. README / image build

- [ ] Rewrite the "Install RPi" section for Trixie Lite: apt packages, uv/venv, NetworkManager profiles, USB mount replacement, sudoers, systemd units, cloud-init settings.
