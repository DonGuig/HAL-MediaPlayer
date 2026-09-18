#we blank the screen so the console text doesn't appear
import subprocess

def blank_console():
    try:
        ssid_out = subprocess.run(
            'setterm -cursor off && sudo sh -c "TERM=linux setterm -foreground black -clear all >/dev/tty0"',
            shell=True,
            text=True,
            check=True,
            capture_output=True)
    except Exception as e:
        print("Exception trying to blank the console %s" % str(e))
