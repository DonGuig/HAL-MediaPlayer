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

## 3. HDMI on/off — **medium to large, needs research**

- [ ] `vcgencmd display_power 0/1` (`/api/hdmi_on`, `/api/hdmi_off`) **does not work under KMS**. No clean drop-in while VLC holds DRM master. Options to prototype:
  - `cec-ctl --standby` / `--image-view-on`: changes the TV's power state over CEC rather than cutting the signal; CEC-capable displays only.
  - Forcing the connector off through `/sys/class/drm/card*-HDMI-A-1/status`: a hack that depends on how VLC reacts to hotplug.
  - Having VLC release the output: stop playback and close the vout.

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

- [ ] `raspi-config nonint do_overlayfs`, `get_overlay_now` and `disable_overlayfs` still exist but now depend on the initramfs (see the `auto_initramfs` point in §2).
- [ ] The boot read-only functions (`get_bootro_now`, `disable_bootro`) now target `/boot/firmware`, and their behavior has changed across raspi-config versions. The GUI no longer uses boot read-only, so `/api/getOverlayInfo` (`readOnlyBoot` part) and `/api/disableBootRO` are probably dead code to remove.
- [ ] New on Trixie: `/tmp` is a tmpfs by default. No impact, since uploads go to the app's `media/` folder.

## 7. USB import — **medium**

- [ ] `usbmount` has been unmaintained for years. Since `systemd-udevd` runs in a private mount namespace, mounts made from a udev `RUN` rule are invisible to the rest of the system unless the udevd unit is patched. Replace it with a small udev rule plus `systemd-mount --no-block --collect $devnode /media/usb`, or with udisks2 and a small watcher.
- [ ] exFAT is supported natively by the kernel: `exfat-fuse` isn't needed, and `exfat-utils` is replaced by `exfatprogs`.
- [ ] Existing bug: `volumes_list.__len__ == 0` in `getFileFromUSBDrive` is always False.

## 8. Python runtime, services and install — **medium (mostly image build)**

- [ ] **PEP 668**: system-wide `pip install` is refused, so the README's `pip install eventlet` / `dnspython` steps are dead. `pyproject.toml` + `uv.lock` + `.python-version` 3.13 already exist, and **Trixie ships Python 3.13**. Run both servers from venvs with `ExecStart=/home/<user>/…/.venv/bin/python -m …`. The bare `python` command doesn't exist without `python-is-python3`.
- [ ] Give the OSC server a `pyproject.toml` / venv as well (it only has `requirements.txt`).
- [ ] System packages still needed: `vlc` / `libvlc`, `libmagic1`, `rsync`.
- [ ] **No default `pi` user.** `/home/pi` is hard-coded in both units, in `shutil.disk_usage("/home/pi")` (`getAvailableSpace`, `getFSSize`) and in the resize flag. Either create `pi` when building the image, or make paths relative to the app or `Path.home()`.
- [x] Add an explicit `/etc/sudoers.d/halmp` for `nmcli`, `raspi-config`, `reboot`, `shutdown` and `cp`, instead of relying on the default user's NOPASSWD entry.
- [ ] **authbind** still works, but `AmbientCapabilities=CAP_NET_BIND_SERVICE` in the unit is cleaner and removes a dependency.
- [ ] Unit file bugs, independent of the port:
  - `halmp.service` uses `WantedBy=graphical.target`, but Lite boots to `multi-user.target`.
  - The OSC unit runs `python -m halmp-OSCserver`, but the package is `halmp_OSCserver`.
  - The OSC server reads `REACT_APP_SERVER_PORT`, the main server uses `VITE_SERVER_PORT`.
  - Unit files are duplicated in `RPi Install/` and `packages/server/halmp_server/systemd/`: keep one.

## 9. Console blanking / black screen — **small**

- [x] Keep only `blank_console.py` for blacking out the console. `black_shell.service` is moved to `systemd/backup/` and no longer installed (it is not yet confirmed which of the two actually did the job).
- [ ] Check on hardware that `blank_console()` (writes to `tty0`) blacks out the screen on its own; `setterm` still works on the KMS fbcon.
- [ ] Cleaner on Trixie: add `consoleblank=0 vt.global_cursor_default=0 quiet loglevel=3 logo.nologo` to `cmdline.txt` and drop most of this. `disable_splash=1` still works.

## 10. Filesystem expand / first-boot resize — **small**

- [ ] Bookworm and Trixie already expand the root filesystem on first boot (in the initramfs on Trixie).
- [ ] `/etc/rc.local` isn't there by default, and the rc-local compatibility layer is deprecated in systemd 257. Drop the README rc.local snippet, or replace it with a oneshot unit if really needed.
- [ ] Check that `raspi-config nonint do_expand_rootfs` (the "Expand FS" button) still works on Trixie.
- [ ] Existing bug: `"home/pi/resize_done"` in `factory_reset` is missing its leading `/`.

## 11. Hostname, reboot/shutdown, volume/delay, OSC, HTTP API — **little or nothing**

- [ ] `raspi-config nonint do_hostname` still works. Check that cloud-init doesn't reapply the Imager hostname on reboot (`preserve_hostname: true`).
- Flask, Socket.IO and python-osc are unaffected apart from the venv change.

## 12. Web client — **trivial**

- [ ] Change the `/boot/config.txt` label and the legacy-docs link in `VideoSetup.tsx`.
- [ ] Hide the composite options on Pi 5 (keep them on Pi 3 and Pi 4), and hide the jack audio option on Pi 5. The server must report the Pi model to the client.

## 13. README / image build

- [ ] Rewrite the "Install RPi" section for Trixie Lite: apt packages, uv/venv, NetworkManager profiles, USB mount replacement, sudoers, systemd units, cloud-init settings.
