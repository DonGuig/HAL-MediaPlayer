from flask import request, Response, redirect, Blueprint
from flask_uploads import UploadSet, configure_uploads

import __main__

http_api = Blueprint("http_api", __name__)

media = UploadSet('media')


@http_api.route('/api/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST' and 'media' in request.files:
        print("Handle here.")

        filename = media.save(request.files['media'])
        # flash("Photo saved.")

    return redirect("http://localhost:3000/")


@http_api.post('/api/play')
def play():
    try:
        __main__.vlc_handler.play()
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/pause')
def pause():
    try:
        __main__.vlc_handler.pause()
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/restart')
def restart():
    try:
        __main__.vlc_handler.restart()
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/stop')
def stop():
    try:
        __main__.vlc_handler.stop()
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getTime')
def get_time():
    try:
        return {
            "time": __main__.vlc_handler.media_player.get_time() / 1000,
            "length": __main__.vlc_handler.media_player.get_length() / 1000
        }
    except Exception as e:
        return Response(str(e), status=500)

@http_api.get('/api/getVolume')
def get_volume():
    try:
        return {"volume": __main__.vlc_handler.media_player.audio_get_volume()}
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/setVolume')
def set_volume():
    try:
        __main__.vlc_handler.media_player.audio_set_volume(int(request.json["volume"]))
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)
