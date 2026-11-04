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

On the RPi, execute the script `packages/server/halmp_server/systemd/install_service.sh`.

#### Networking

`install_service.sh` runs `setup_network.sh`, which:

- stops cloud-init from managing the network, so Wi-Fi settings entered in Raspberry Pi Imager won't apply,
- sets the Wi-Fi country to `FR`,
- creates the single wired profile `eth0`, using DHCP with a link-local (169.254.x.x) address when no other address is set, and deletes the other wired profiles.

Reboot afterwards : `sudo reboot`

#### Run with webserver on port 80

```shell
sudo apt install authbind
sudo touch /etc/authbind/byport/80
sudo chmod 777 /etc/authbind/byport/80
```

then start server with :
`authbind --deep python3 -m halmp_server`

<https://gist.github.com/justinmklam/f13bb53be9bb15ec182b4877c9e9958d>

#### USB drives automount

`install_service.sh` installs the udev rule `99-halmp-usb-mount.rules`, which mounts each USB partition read-only in `/media/usb-<partition>` (for example `/media/usb-sda1`). There is nothing else to install: FAT32 and exFAT are supported by the kernel.

## TO REMOVE FROM RPi SD BEFORE RELEASE

Github credentials
Claude


## TODO
