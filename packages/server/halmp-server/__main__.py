import os
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO
from flask_cors import CORS
from pathlib import Path
from dotenv import load_dotenv
import subprocess

# from .vlc_handler import vlc_handler
from .vlc_handler import VLC_Handler
from .config_handler import ConfigHandler
from .http_api import http_api

# subprocess.run(
#     "setterm -cursor off && sudo sh -c 'TERM=linux setterm -foreground black -clear all >/dev/pts/0'",
#     shell=True,
#     text=True,
#     capture_output=True,
# )


accepted_media_extensions = ["mp4", "mov", "mp3", "wav", "flac", "aac", "aiff"]

static_index_file_path = Path.resolve(Path(__file__).parent / "static" / "index.html")
dotenv_path = Path.resolve(Path(__file__).parents[3] / ".env")

load_dotenv(dotenv_path=dotenv_path, override=True)

app = Flask(__name__, static_url_path="")
CORS(app)
app.register_blueprint(http_api)
# app.config['SECRET_KEY'] = 'secret!'

socketio = SocketIO(app, async_mode="eventlet", cors_allowed_origins="*")


# Serve React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, "index.html")


@socketio.on("connect")
def connected():
    """event listener when client connects to the server"""
    print("client has connected %s" % request.sid)


@socketio.on("/setTime")
def set_time(input_time):
    vlc_handler.media_player.set_time(int(input_time * 1000))


if __name__ == "__main__":
    cfg_handler: ConfigHandler = ConfigHandler()
    vlc_handler = VLC_Handler()
    print("Starting server on port %s" % os.environ.get("REACT_APP_SERVER_PORT"))
    socketio.run(
        app, debug=False, host="0.0.0.0", port=os.environ.get("REACT_APP_SERVER_PORT")
    )
