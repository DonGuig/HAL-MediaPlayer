# Power the HDMI signal down and up under KMS, where vcgencmd display_power has no effect.
# Blanking the framebuffer only works once nothing else holds the display (the kernel
# silently ignores it otherwise), so VLC must have closed its video output first.
import os
import subprocess
import time

FB_BLANK_PATH = "/sys/class/graphics/fb0/blank"
FB_BLANK_UNBLANK = "0\n"
FB_BLANK_POWERDOWN = "4\n"


def _set_fb_blank(value: str):
    # sudo tee on this exact path is what /etc/sudoers.d/halmp allows
    subprocess.run(['sudo', 'tee', FB_BLANK_PATH],
                   input=value,
                   text=True,
                   stdout=subprocess.DEVNULL,
                   stderr=subprocess.PIPE,
                   check=True)


def _holds_display() -> bool:
    # libvlc runs in this process, so its /dev/dri/card* handle shows up here
    for fd in os.listdir("/proc/self/fd"):
        try:
            if os.readlink("/proc/self/fd/" + fd).startswith("/dev/dri/card"):
                return True
        except OSError:
            pass  # fd closed since listdir
    return False


def power_down(timeout: float = 3.0):
    deadline = time.monotonic() + timeout
    while _holds_display():
        if time.monotonic() > deadline:
            raise Exception("VLC did not release the display, HDMI signal is still on")
        time.sleep(0.05)
    _set_fb_blank(FB_BLANK_POWERDOWN)


def power_up():
    _set_fb_blank(FB_BLANK_UNBLANK)
