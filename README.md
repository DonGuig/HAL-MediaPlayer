# HAL MediaPlayer - Player pour Raspberry Pi avec contrôle par web // OSC

## Environnement de développement

Version de node utilisée : `18.12.1` (utiliser nvm)

Il faut peut-être faire `nvm alias default 18.12.1` pour que cette version de Node soit utilisée par VSCode.

Exécuter à la racine du projet, puis dans les dossiers `packages/client` et `packages/server`:
`npm install`

### Développement

Se servir des "launch configuration" de VSCode :

Pour le développement du client et du server, utiliser les launch configurations `Run client (dev)`, `run server (python)`, et `Chrome (dev client)`.

Pour utiliser en local sur le client + server en configuration prod (par exemple pour travailler sur le light_engine en python tout en ayant accès à l'interface web et au server Node), utiliser les launch configuration `Build server + client (prod)` et `Run server + client (prod)`.

### Install RPi

sudo apt update
sudo apt install vlc

pip install eventlet
Ca donne un message d'erreur, pour réparer, faire :
python3 -m pip install dnspython==2.2.1

Si RPi 3B+ :
sudo raspi-config nonint do_memory_split 128

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

## TODO
