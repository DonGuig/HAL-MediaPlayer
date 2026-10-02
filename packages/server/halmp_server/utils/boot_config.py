# Read and write the Raspberry Pi boot files (/boot/firmware on Bookworm and later).
# The server only owns a marked block at the end of config.txt; the rest of the file
# (stock defaults, HiFiBerry overlays, manual edits) is left untouched.
import subprocess

CONFIG_TXT_PATH = "/boot/firmware/config.txt"
CMDLINE_TXT_PATH = "/boot/firmware/cmdline.txt"

MANAGED_BEGIN = "# --- HALMP managed: begin (rewritten by HAL Media Player, do not edit) ---"
MANAGED_END = "# --- HALMP managed: end ---"


def write_config_txt(txt: str):
    # sudo tee on this exact path is what /etc/sudoers.d/halmp allows
    subprocess.run(['sudo', 'tee', CONFIG_TXT_PATH],
                   input=txt,
                   text=True,
                   stdout=subprocess.DEVNULL,
                   stderr=subprocess.PIPE,
                   check=True)


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


def set_managed_block(block: str):
    with open(CONFIG_TXT_PATH, 'r') as f:
        config = f.read()
    write_config_txt(replace_managed_block(config, block))
