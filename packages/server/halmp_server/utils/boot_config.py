# Read and write the Raspberry Pi boot files (/boot/firmware on Bookworm and later).
# The server only owns a marked block at the end of config.txt and a few values in
# cmdline.txt; the rest (stock defaults, HiFiBerry overlays, PARTUUID, manual edits)
# is left untouched.
import subprocess
from pathlib import Path

CONFIG_TXT_PATH = "/boot/firmware/config.txt"
CMDLINE_TXT_PATH = "/boot/firmware/cmdline.txt"

MANAGED_BEGIN = "# --- HALMP managed: begin (rewritten by HAL Media Player, do not edit) ---"
MANAGED_END = "# --- HALMP managed: end ---"

# cmdline.txt values owned by the server: any value starting with one of these is replaced
MANAGED_CMDLINE_PREFIXES = ("video=HDMI-A-1:", "video=Composite-1:", "vc4.tv_norm=")

BOOT_CONFIGS_PATH = Path(__file__).parents[1] / "resources" / "boot_configs"

# config.txt fragments (each starts in [all]) and cmdline.txt values for each video mode
VIDEO_MODES = {
    "HDMI": {
        "fragments": ["common.txt"],
        "cmdline": [],
    },
    "HDMIForce1080p60": {
        # D forces the output on even if no display is detected (was hdmi_force_hotplug)
        "fragments": ["common.txt"],
        "cmdline": ["video=HDMI-A-1:1920x1080M@60D"],
    },
    "CompositePAL": {
        "fragments": ["common.txt", "composite.txt"],
        "cmdline": ["vc4.tv_norm=PAL", "video=Composite-1:720x576@50ie"],
    },
    "CompositeNTSC": {
        "fragments": ["common.txt", "composite.txt"],
        "cmdline": ["vc4.tv_norm=NTSC", "video=Composite-1:720x480@60ie"],
    },
}
COMPOSITE_MODES = ("CompositePAL", "CompositeNTSC")


def is_pi5() -> bool:
    # BCM2712 covers Pi 5, Pi 500 and CM5
    with open("/proc/device-tree/compatible", "rb") as f:
        return b"brcm,bcm2712" in f.read()


def _sudo_tee(path: str, txt: str):
    # sudo tee on this exact path is what /etc/sudoers.d/halmp allows
    subprocess.run(['sudo', 'tee', path],
                   input=txt,
                   text=True,
                   stdout=subprocess.DEVNULL,
                   stderr=subprocess.PIPE,
                   check=True)


def write_config_txt(txt: str):
    _sudo_tee(CONFIG_TXT_PATH, txt)


def replace_managed_block(config: str, block: str) -> str:
    """Return config with the managed block replaced by block, appended if missing."""
    lines = config.splitlines()
    begins = [i for i, line in enumerate(lines) if line.strip() == MANAGED_BEGIN]
    ends = [i for i, line in enumerate(lines) if line.strip() == MANAGED_END]

    # Wrapped in [all] so a filter like [pi5] before the block can't capture it,
    # and a filter inside the block doesn't leak into lines after it
    managed = [MANAGED_BEGIN, "[all]", *block.strip("\n").splitlines(), "[all]", MANAGED_END]

    if not begins and not ends:
        while lines and lines[-1].strip() == "":
            lines.pop()
        if lines:
            lines.append("")
        lines += managed
    elif len(begins) == 1 and len(ends) == 1 and begins[0] < ends[0]:
        lines[begins[0]:ends[0] + 1] = managed
    else:
        raise ValueError("config.txt has broken HALMP managed markers, fix them by hand")

    return "\n".join(lines) + "\n"


def replace_cmdline_values(cmdline: str, values: list) -> str:
    """Return cmdline with the server-owned values replaced by values, everything else kept in order."""
    if "\"" in cmdline or "\n" in cmdline.strip():
        # Quoted values or several lines: splitting on spaces would corrupt them
        raise ValueError("cmdline.txt has an unexpected format, fix it by hand")
    kept = [v for v in cmdline.split() if not v.startswith(MANAGED_CMDLINE_PREFIXES)]
    return " ".join(kept + values) + "\n"


def apply_video_mode(mode: str):
    if mode not in VIDEO_MODES:
        raise ValueError("Unknown video mode %s" % mode)
    if mode in COMPOSITE_MODES and is_pi5():
        raise ValueError("Composite output is not supported on Raspberry Pi 5")

    video_mode = VIDEO_MODES[mode]
    block = "\n".join((BOOT_CONFIGS_PATH / f).read_text() for f in video_mode["fragments"])

    with open(CONFIG_TXT_PATH, 'r') as f:
        config = replace_managed_block(f.read(), block)
    with open(CMDLINE_TXT_PATH, 'r') as f:
        cmdline = replace_cmdline_values(f.read(), video_mode["cmdline"])

    # Both files are checked above before either is written
    write_config_txt(config)
    _sudo_tee(CMDLINE_TXT_PATH, cmdline)
