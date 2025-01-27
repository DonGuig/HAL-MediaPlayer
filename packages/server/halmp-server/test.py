import subprocess

out = subprocess.run('rfkill list',
                     shell=True,
                     text=True,
                     check=True,
                     capture_output=True)

print(out.stdout)
windex = out.stdout.find("Wireless LAN")
blockindex = out.stdout.find("Soft blocked: ")
res = out.stdout[blockindex+14:blockindex+17]
if res.find("yes") != -1:
    print("wifi disabled")
elif res.find("no") != -1:
    print("wifi enabled")
else:
    print("trouble")


ssid_out = subprocess.run('iwgetid | awk \'{print $2}\' | cut -c 8- | rev | cut -c 2- | rev',
                             shell=True,
                             text=True,
                             check=True,
                             capture_output=True)
ssid = ssid_out.stdout.strip()
print(ssid)