# Watches the alarm the kernel raises when the Pi's power supply sags. It's the same source
# as the "Undervoltage detected!" console messages, which black_shell.service hides.
import glob
import os
import select
from typing import Callable, Optional

HWMON_GLOB = "/sys/class/hwmon/hwmon*"
HWMON_NAME = "rpi_volt"
ALARM_FILE = "in0_lcrit_alarm"


def _find_alarm_path() -> Optional[str]:
    # The hwmon number can change between boots
    for hwmon in glob.glob(HWMON_GLOB):
        try:
            with open(os.path.join(hwmon, "name")) as f:
                if f.read().strip() == HWMON_NAME:
                    return os.path.join(hwmon, ALARM_FILE)
        except OSError:
            pass
    return None


def is_active() -> bool:
    path = _find_alarm_path()
    if path is None:
        return False
    with open(path) as f:
        return f.read().strip() == "1"


def watch(on_undervoltage: Callable[[], None]):
    """Blocks forever, calling on_undervoltage each time the alarm is raised"""
    path = _find_alarm_path()
    if path is None:
        print("No %s sensor, not watching for undervoltage" % HWMON_NAME)
        return

    with open(path) as alarm:
        # The kernel signals a change with POLLPRI, after the file has been read once
        active = alarm.read().strip() == "1"
        poller = select.poll()
        poller.register(alarm, select.POLLPRI | select.POLLERR)
        while True:
            poller.poll()
            alarm.seek(0)
            was_active = active
            active = alarm.read().strip() == "1"
            if active and not was_active:
                on_undervoltage()
