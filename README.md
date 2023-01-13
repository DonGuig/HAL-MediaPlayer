# HAL MediaPlayer - Player pour Raspberry Pi avec contrôle par web // OSC

## Environnement de développement

Version de node utilisée : `18.12.1` (utiliser nvm)

Il faut peut-être faire `nvm alias default 18.12.1` pour que cette version de Node soit utilisée par VSCode.

Exécuter à la racine du projet, puis dans les dossiers `packages/client` et `packages/server` et `packages/shared`:
`npm install`

### Développement

Se servir des "launch configuration" de VSCode :

Pour le développement du client et du server, utiliser les launch configurations `Client (dev)`, `Server (dev)`, et `Chrome (dev client)`.

Pour utiliser en local sur le client + server en configuration prod (par exemple pour travailler sur le light_engine en python tout en ayant accès à l'interface web et au server Node), utiliser les launch configuration `Build server + client (prod)` et `Run server + client (prod)`.


### Install RPi

sudo apt update
sudo apt install vlc

curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
sudo apt install nodejs

Si RPi 3B+ :
sudo raspi-config nonint do_memory_split 256

reboot

options pour clvc audio :
--aout alsa --alsa-audio-device hw:0,0
hw:0,0 : HDMI
hw:1,0 : jack
hw:2,0 : USB card

option pour cvlc :
--intf http --http-password vlcremote
--input-repeat 999999 ???