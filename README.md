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

pip install git+https://github.com/maxcountryman/flask-uploads.git@f66d7dc93e684fa0a3a4350a38e41ae00483a796

Or in a requirements.txt:

git+https://github.com/maxcountryman/flask-uploads.git@f66d7dc93e684fa0a3a4350a38e41ae00483a796


curl -sL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install nodejs

Si RPi 3B+ :
sudo raspi-config nonint do_memory_split 256

Networking :
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



reboot

options pour clvc audio :
--aout alsa --alsa-audio-device hw:0,0
hw:0,0 : HDMI
hw:1,0 : jack
hw:2,0 : USB card

option pour cvlc :
--intf http --http-password vlcremote
--input-repeat 999999 ???

Run on raspberry pi on port 80 :

sudo apt install authbind
sudo touch /etc/authbind/byport/80
sudo chmod 777 /etc/authbind/byport/80

then start server with :
authbind --deep python3 app.py

https://gist.github.com/justinmklam/f13bb53be9bb15ec182b4877c9e9958d



TODO :
    - mode composite NTSC