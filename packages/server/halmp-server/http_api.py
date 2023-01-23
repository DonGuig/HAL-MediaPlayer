from flask import request, Response, redirect, Blueprint
from flask_uploads import UploadSet, configure_uploads
import os

import __main__

http_api = Blueprint("http_api", __name__)

@http_api.post('/api/uploadVideoFile')
def upload_file():
    if 'media' in request.files:
        print("Handle here.")
        __main__.vlc_handler.stop()
        existing_video_file = __main__.vlc_handler.get_video_file()
        if existing_video_file:
            os.remove(existing_video_file)
        filename = __main__.media.save(request.files['media'])
        __main__.vlc_handler.refresh_video_file()
        __main__.vlc_handler.play()
        # flash("Photo saved.")

    return Response(status=200)


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
        vol = int(request.json["volume"])
        __main__.vlc_handler.media_player.audio_set_volume(vol)
        __main__.cfg_handler.change_config("volume", vol)
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)

@http_api.get('/api/getAudioDelay')
def get_audio_delay():
    try:
        return {"delay": __main__.vlc_handler.media_player.audio_get_delay()}
    except Exception as e:
        return Response(str(e), status=500)

@http_api.post('/api/setAudioDelay')
def set_audio_delay():
    try:
        delay = int(request.json["delay"])
        __main__.vlc_handler.media_player.audio_set_delay(delay)
        __main__.cfg_handler.change_config("audio_delay", delay)
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)

@http_api.get('/api/getDeviceName')
def get_device_name():
    try:
        return {"deviceName" : __main__.cfg_handler.cfg.device_name}
    except Exception as e:
        return Response(str(e), status=500)       

@http_api.post('/api/setDeviceName')
def set_device_name():
    try:
        __main__.cfg_handler.change_config("device_name", request.json["deviceName"])
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)