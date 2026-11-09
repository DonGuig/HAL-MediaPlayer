from flask import request, Response, redirect, Blueprint, jsonify, send_file
from werkzeug.utils import secure_filename
import glob
import os
import subprocess
import shutil
from pathlib import Path
import magic

import __main__

from .utils import network
from .utils.boot_config import CONFIG_TXT_PATH, write_config_txt, apply_video_mode, is_overlay_active, get_pi_model

http_api = Blueprint("http_api", __name__)

resourcesPath = Path(__file__).parent / "resources"
media_folder_path = Path(__file__).parent / "media"


def network_error_response(e):
    if isinstance(e, KeyError):
        return Response(f"Missing field: {e}", status=400)
    if isinstance(e, ValueError):
        return Response(str(e), status=400)
    if isinstance(e, subprocess.CalledProcessError):
        # Not str(e): it quotes the command, which can hold a Wi-Fi password
        return Response(e.stderr, status=500)
    return Response(str(e), status=500)


@http_api.post('/api/ping')
def ping():
    """
    Endpoint to check if the server is running.
    Returns a simple response to indicate server status.
    """
    try:
        return Response(status=200)
    except Exception as e:
        print(e)
        return Response(str(e), status=500)

@http_api.post('/api/uploadMediaFile')
def upload_file():
    try:
        if 'file' not in request.files:
            return Response("No file in request", status=400)
        else:
            file = request.files['file']
            filename = secure_filename(file.filename)

            saved_file_path = media_folder_path / filename

            if 'Content-Range' in request.headers:
                # extract starting byte from Content-Range header string
                range_str = request.headers['Content-Range']
                start_bytes = int(range_str.split(' ')[1].split('-')[0])

                if start_bytes == 0:
                    # we are at the beginning of a new file transfer
                    __main__.vlc_handler.stop()
                    __main__.vlc_handler.remove_all_media_files()

                # append chunk to the file on disk, or create new
                with open(saved_file_path, 'ab') as f:
                    f.seek(start_bytes)
                    f.write(file.stream.read())

            else:
                # this is not a chunked request, so just save the whole file
                __main__.vlc_handler.stop()
                __main__.vlc_handler.remove_all_media_files()
                file.save(saved_file_path)

            # send response with appropriate mime type header
            return jsonify({"name": file.filename,
                            "size": os.path.getsize(saved_file_path),
                            "url": 'uploads/' + file.filename,
                            "thumbnail_url": None,
                            "delete_url": None,
                            "delete_type": None, })
    except Exception as e:
        print(e)
        return Response(str(e), status=500)


@http_api.post('/api/uploadFinalized')
def upload_finalized():
    try:
        __main__.vlc_handler.refresh_media_file()
        __main__.vlc_handler.play()

        print("received uploadFinalized")

        return Response(status=200)

    except Exception as e:
        return Response(str(e), status=500)


def progress_cb(percent: int):
    print("progress %i" % percent)
    __main__.socketio.emit("copy_progress", percent)


@http_api.post('/api/getFileFromUSBDrive')
def get_file_from_usb_drive():
    try:
        # USB drive partitions are mounted in /media/usb-<partition>
        # (see systemd/99-halmp-usb-mount.rules)

        media_file_path = ""

        volumes_list = sorted(glob.glob("/media/usb-*"))
        if len(volumes_list) == 0:
            raise Exception("No USB drive found")

        for volume in volumes_list:
            temp_raw_files_list = os.listdir(volume)
            temp_raw_files_list.sort()
            # we remove hidden files starting with .
            for file in temp_raw_files_list:
                if file[0] != '.':
                    file_path = os.path.join(volume, file)
                    # we keep only files the player accepts, exclude directories
                    if __main__.is_accepted_media_file(file) and os.path.isfile(file_path):
                        file_type = magic.from_file(file_path,
                                                    mime=True).split("/")[0]
                        if file_type == "audio" or file_type == "video":
                            media_file_path = file_path
                            break
            if media_file_path != "":
                break

        if media_file_path != "":
            __main__.vlc_handler.stop()
            __main__.vlc_handler.remove_all_media_files()
            __main__.socketio.emit("about to copy !!!!")
            filename = os.path.basename(media_file_path)
            filesize = os.path.getsize(media_file_path)
            __main__.socketio.emit("file_info", {
                "fileName": filename,
                "fileSize": filesize
            })
            with subprocess.Popen(
                ['rsync', '--progress', media_file_path, media_folder_path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    bufsize=1,
                    universal_newlines=True) as cmd:
                for line in cmd.stdout:
                    print(line, end='')
                    for word in line.split(" "):
                        if word.endswith("%"):
                            num = word.rstrip("%")
                            percentage = int(num)
                            __main__.socketio.start_background_task(
                                __main__.socketio.emit, "copy_progress",
                                percentage)
                # wait() and not poll(): rsync may not have exited yet when its output ends
                if cmd.wait() != 0:
                    raise Exception("Error copying : %s" % cmd.stderr.read())

            __main__.vlc_handler.refresh_media_file()
            __main__.vlc_handler.play()
        else:
            raise Exception("No media file found on drive (or no drive)")

        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/removeMediaFile')
def remove_media_file():
    try:
        __main__.vlc_handler.stop()
        __main__.vlc_handler.remove_all_media_files()
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getFileNameAndSize')
def get_filename_and_size():
    try:
        fileName = __main__.vlc_handler.get_current_media_filename()
        print(fileName)
        fileSize = __main__.vlc_handler.get_current_media_file_size()
        return {"fileName": fileName, "fileSize": fileSize}
    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getAvailableSpace')
def get_available_space():
    try:
        total, used, free = shutil.disk_usage(
            "/home/pi")
        return {"space": free}
    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getFSSize')
def get_fs_size():
    try:
        total, used, free = shutil.disk_usage(
            "/home/pi")
        return {"size": total}
    except Exception as e:
        return Response(str(e), status=500)


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
        res = __main__.vlc_handler.media_player.audio_set_volume(vol)
        if res == -1:
            raise Exception("Volume out of range")
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
        res = __main__.vlc_handler.media_player.audio_set_delay(delay)
        if res == -1:
            raise Exception("Error setting audio delay")
        __main__.cfg_handler.change_config("audio_delay", delay)
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getDeviceName')
def get_device_name():
    try:
        return {"deviceName": __main__.cfg_handler.cfg.device_name}
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/setDeviceName')
def set_device_name():
    try:
        __main__.cfg_handler.change_config("device_name",
                                           request.json["deviceName"])
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getWiredNetwokConfig')
def get_wired_network_config():
    try:
        return network.get_wired_config()
    except Exception as e:
        return network_error_response(e)


@http_api.post('/api/setWiredNetwokConfig')
def set_wired_network_config():
    try:
        DHCPorFixed = request.json["DHCPorFixed"]

        if DHCPorFixed == "DHCP":
            network.set_wired_dhcp()
        elif DHCPorFixed == "Fixed IP":
            network.set_wired_fixed(request.json["ipAddress"],
                                    request.json["netmask"])
        else:
            raise ValueError("DHCPorFixed must be DHCP or Fixed IP")

        return Response(status=200)
    except Exception as e:
        return network_error_response(e)


@http_api.get('/api/getAudioOutput')
def get_audio_output():
    try:
        return {"audioOutput": __main__.vlc_handler.get_current_audio_output()}
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/setAudioOutput')
def set_audio_output():
    try:
        __main__.vlc_handler.set_current_audio_output(
            request.json["audioOutput"])
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getHostname')
def get_hostname():
    try:
        return {"hostname": network.get_hostname()}
    except Exception as e:
        return network_error_response(e)


@http_api.post('/api/setHostname')
def set_hostname():
    try:
        network.set_hostname(request.json["hostname"])
        return Response(status=200)
    except Exception as e:
        return network_error_response(e)


@http_api.post('/api/reboot')
def reboot():
    try:
        subprocess.run('sudo reboot',
                       shell=True,
                       check=True,
                       capture_output=True)
        return Response(status=200)
    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.post('/api/shutdown')
def shutdown():
    try:
        subprocess.run('sudo shutdown now',
                       shell=True,
                       check=True,
                       capture_output=True)
        return Response(status=200)
    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.post('/api/expandFS')
def expandFS():
    try:
        subprocess.run('sudo raspi-config nonint do_expand_rootfs',
                       shell=True,
                       check=True,
                       capture_output=True)
        return Response(status=200)
    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.post('/api/setVideoOutput')
def set_video_output():
    try:
        apply_video_mode(request.json["videoOutput"])
        return Response(status=200)
    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.get('/api/getConfigTXT')
def get_config_txt():
    try:
        lines: str = ""
        with open(CONFIG_TXT_PATH, 'r') as f:
            lines = f.read()

        return {"txt": lines}
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/sendConfigTXT')
def send_config_txt():
    try:
        txt: str = request.json["txt"]
        if txt != "":
            write_config_txt(txt)

        return Response(status=200)
    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.post('/api/setWifiConfig')
def set_wifi_config():
    try:
        network.connect_wifi(request.json["SSID"], request.json["pass"],
                             request.json["hidden"])
        return Response(status=200)
    except Exception as e:
        return network_error_response(e)


@http_api.get('/api/getIsWifiActive')
def get_is_wifi_active():
    try:
        return {"active": network.is_wifi_active()}
    except Exception as e:
        return network_error_response(e)


@http_api.post('/api/setIsWifiActive')
def set_is_wifi_active():
    try:
        active = request.json["active"]

        if active not in ("true", "false"):
            raise ValueError("active must be true or false")
        network.set_wifi_active(active == "true")

        return Response(status=200)
    except Exception as e:
        return network_error_response(e)


@http_api.get('/api/getCurrentWifi')
def get_current_wifi():
    try:
        return {"SSID": network.get_current_ssid()}
    except Exception as e:
        return network_error_response(e)


@http_api.post('/api/forgetKnownWifis')
def http_post_forget_known_wifis():
    try:
        network.forget_known_wifis()
        return Response(status=200)
    except Exception as e:
        return network_error_response(e)


@http_api.get('/api/getTransportStatus')
def get_transport_status():
    try:
        status = __main__.vlc_handler.get_player_status()
        return {"stopped": status["stopped"], "paused": status["paused"]}

    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getPiModel')
def get_pi_model_route():
    try:
        return {"model": get_pi_model()}
    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getOverlayInfo')
def get_overlay_info():
    try:
        return {"overlayActive": is_overlay_active()}

    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.post('/api/setReadOnlyFS')
def set_read_only_filesystem():
    try:
        process = subprocess.run(
            'sudo raspi-config nonint enable_overlayfs',
            shell=True,
            text=True,
            check=True,
            capture_output=True)

        return Response(status=200)

    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.post('/api/disableOverlayFS')
def disable_overlay():
    try:
        process = subprocess.run(
            'sudo raspi-config nonint disable_overlayfs',
            shell=True,
            text=True,
            check=True,
            capture_output=True)

        return Response(status=200)

    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.get('/api/handbrakepreset')
def get_handbrake_preset():
    try:
        return send_file(resourcesPath / "handbrake_preset" / "HAL_Media_Player_H264_1080p.json", as_attachment=True,)
        # return Response(str(e), status=500)

    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/hdmi_on')
def hdmi_on():
    try:
        __main__.vlc_handler.hdmi_on()
        return Response(status=200)

    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.post('/api/hdmi_off')
def hdmi_off():
    try:
        __main__.vlc_handler.hdmi_off()
        return Response(status=200)

    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.post('/api/factory_reset')
def factory_reset():
    try:
        # delete media file
        __main__.vlc_handler.stop()
        __main__.vlc_handler.remove_all_media_files()

        print('removed media file')

        network.forget_known_wifis()

        # put eth0 on the factory fixed IP

        network.set_wired_fixed(network.FACTORY_WIRED_IP,
                                network.FACTORY_WIRED_NETMASK)

        print('put ethernet connection on the factory fixed IP')

        # reset hostname

        network.set_hostname(network.DEFAULT_HOSTNAME)

        print('reset hostname')

        # put volume at 100%

        __main__.vlc_handler.media_player.audio_set_volume(100)
        __main__.cfg_handler.change_config("volume", 100)

        print('put volume at 100%')

        # put audio delay at 0

        __main__.vlc_handler.media_player.audio_set_delay(0)
        __main__.cfg_handler.change_config("audio_delay", 0)

        print('put audio delay at 0')

        # put audio device to headphone jack

        __main__.vlc_handler.set_current_audio_output(
            "jack")

        print('put audio out to jack')

        # back to HDMI video output (config.txt managed block and cmdline.txt)

        apply_video_mode("HDMI")

        print('set video output to HDMI')

        # reboot
        subprocess.run('sudo reboot',
                       shell=True,
                       check=True,
                       capture_output=True)

        return Response(status=200)

    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)


@http_api.post('/api/set_time')
def set_time():
    try:
        time = request.json["time"]
        __main__.vlc_handler.seek(int(time*1000))

        return Response(status=200)

    except Exception as e:
        if hasattr(e, "stderr"):
            err = e.stderr
        else:
            err = str(e)
        return Response(err, status=500)
