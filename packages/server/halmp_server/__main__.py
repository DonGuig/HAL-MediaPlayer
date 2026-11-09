import os
from flask import Flask, send_from_directory, request, make_response
from flask_socketio import SocketIO
from flask_cors import CORS
from pathlib import Path
from dotenv import load_dotenv
import subprocess

from .vlc_handler import VLC_Handler
from .config_handler import ConfigHandler
from .http_api import http_api


accepted_media_extensions = ["mp4", "mov", "mp3", "wav", "flac", "aac", "aiff"]


def is_accepted_media_file(filename):
    return Path(filename).suffix[1:].lower() in accepted_media_extensions


static_index_file_path = Path.resolve(
    Path(__file__).parent / "static" / "index.html")

dotenv_path = Path.resolve(Path(__file__).parents[3] / ".env")
load_dotenv(dotenv_path=dotenv_path, override=True)

app = Flask(__name__, static_url_path="")
CORS(app, origins='*')
app.register_blueprint(http_api)
# app.config['SECRET_KEY'] = 'secret!'

# The short heartbeat is how clients notice within a few seconds that the player is gone
socketio = SocketIO(app, async_mode="threading", cors_allowed_origins="*",
                    ping_interval=2, ping_timeout=4)

# Merges the bursts of VLC events
PLAYER_STATUS_MIN_INTERVAL_S = 0.1


# Serve React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        response = make_response(send_from_directory(app.static_folder, path))
    else:
        response = make_response(send_from_directory(app.static_folder, "index.html"))

    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = 'Thu, 01 Jan 1970 00:00:00 GMT'  # Properly formatted past date

    # if path != "" and os.path.exists(app.static_folder + "/" + path):
    #     response = send_from_directory(app.static_folder, path)
    # else:
    #     response = send_from_directory(app.static_folder, "index.html")
    return response




@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, "index.html")


@socketio.on("connect")
def connected():
    """event listener when client connects to the server"""
    print("client has connected %s" % request.sid)
    socketio.emit("player_status", vlc_handler.get_player_status(), to=request.sid)


@socketio.on("/setTime")
def set_time(input_time):
    vlc_handler.seek(int(input_time * 1000))


def broadcast_player_status():
    """Pushes the status when it changes, whatever changed it (web client, OSC, end of media...)"""
    last_status = None
    while True:
        vlc_handler.status_changed.wait()
        # Cleared before reading, so a change during the read wakes this loop again
        vlc_handler.status_changed.clear()
        try:
            status = vlc_handler.get_player_status()
            if status != last_status:
                socketio.emit("player_status", status)
                last_status = status
        except Exception as e:
            print(e)
        socketio.sleep(PLAYER_STATUS_MIN_INTERVAL_S)


if __name__ == "__main__":
    cfg_handler: ConfigHandler = ConfigHandler()
    vlc_handler = VLC_Handler()
    port = int(os.getenv("VITE_SERVER_PORT", 80))
    print("Starting server on port %s" % port)
    socketio.start_background_task(broadcast_player_status)
    socketio.run(
        app, debug=False, host="0.0.0.0", port=port, allow_unsafe_werkzeug=True
    )
