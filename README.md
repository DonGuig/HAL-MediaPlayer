# HAL MediaPlayer - Raspberry Pi Networked Media Player with web interface and HTTP / OSC control.

## Releases

You can download the latest configured OS disk image from the website : [https://www.hal-art.io/hal-media-player](https://www.hal-art.io/hal-media-player)

This the fastest way to start working on development, as the player relies on a very specific OS environment and there is no need to recreate this environment from scratch (although you will find instructions to do so below).

## Development environment

The client is in Typescript/React. The server in Python/Flask.

Node version used : `22.14.0` (use nvm)

You may have to do `nvm alias default 22.14.0` for this node version to be used by VSCode.

Execute in project root, then in folders `packages/client` the following command :
`npm install`

### Development

Use the "launch configuration" in VSCode :

To dev on client and server, use launch configurations `Run client (dev)`, `run server (python)`, et `Chrome (dev client)`.

To dev the client locally on your machine but control the server on a RPi and configure in `.env`in project root : `VITE_LOCAL_DEV_SERVER=0` and `VITE_RASPBERRY_PI_IP` with the IP or hostname of your raspberry pi. You can then use the launch configuration `run client (dev)`.

### Install RPi

sudo apt update
sudo apt install vlc

pip install eventlet
This may give an error message :
python3 -m pip install dnspython==2.2.1

### Autostart with systemd

On the RPi, execute the script `install_service.sh` located in `./RPi Install`.

#### Networking

in raspi-config, switch network config to Network Manager

`sudo raspi-config`
Then `Advanced options` then `Network Config`, select `Network Manager`

Delete the default connection in Network Manager :
`nmcli con show`then note down the name of the connection
`nmcli con del name`where you substitue name for the name of the connection

Add the two connection profiles for ethernet :
`nmcli con add type ethernet ifname eth0 con-name eth0 connection.autoconnect-priority 100 connection.autoconnect-retries 1 ipv4.dhcp-timeout 3 ipv4.method auto`
and
`nmcli con add type ethernet ifname eth0 con-name eth0-ll connection.autoconnect-priority 50 ipv4.method link-local`

`sudo reboot`

#### Run with webserver on port 80

```shell
sudo apt install authbind
sudo touch /etc/authbind/byport/80
sudo chmod 777 /etc/authbind/byport/80
```

then start server with :
`authbind --deep python3 -m halmp-server`

<https://gist.github.com/justinmklam/f13bb53be9bb15ec182b4877c9e9958d>

#### enable usb drives automount

```shell
cd ~
git clone https://github.com/rbrito/usbmount.git
cd usbmount

# Install dependencies
sudo apt-get update && sudo apt-get install -y debhelper build-essential

# Build
sudo dpkg-buildpackage -us -uc -b

cd ..
# Try install, will not necessarily complete if you're missing a dependency
dpkg -i usbmount_0.0.24_all.deb
# Will install missing dependencies and finish the install process
apt-get install -f
```

To enable exfat drives :

```shell
sudo apt-get install exfat-fuse
sudo apt-get install exfat-utils
```

Then got edit the file usbmount.conf :
`sudo nano /etc/usbmount/usbmount.conf`
...and add exfat to the following line :
`FILESYSTEMS="vfat ext2 ext3 ext4 hfsplus exfat"`

#### Enable auto filesystem resize on first boot

Add the following to `/etc/rc.local` :
```shell
if [ ! -f /home/pi/resize_done ]; then
    raspi-config --expand-rootfs
    touch /home/pi/resize_done
    reboot
fi
```

Make sure to remove the file /home/pi/resize_done before making a disk image out of the SD card.

## TODO
