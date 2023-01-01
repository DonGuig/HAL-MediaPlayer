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
