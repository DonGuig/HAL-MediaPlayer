import * as VLC from "vlc-client"

const vlcClient = new VLC.Client({
    ip: "localhost",
    port: 8080,
    password: "vlcremote"
});

export default vlcClient;
