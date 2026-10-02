#we blank the screen so the console text doesn't appear
import subprocess

def blank_console():
    try:
        ssid_out = subprocess.run(
            'setterm -cursor off && TERM=linux setterm -foreground black -clear all | sudo tee /dev/tty0 >/dev/null',
            shell=True,
            text=True,
            check=True,
            capture_output=True)
    except Exception as e:
        print("Exception trying to blank the console %s" % str(e))
