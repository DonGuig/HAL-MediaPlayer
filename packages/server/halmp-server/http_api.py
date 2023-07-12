from flask import request, Response, redirect, Blueprint
from flask_uploads import UploadSet, configure_uploads
import os
import subprocess
import shutil
from pathlib import Path
from ipaddress import IPv4Network
import magic

import __main__

http_api = Blueprint("http_api", __name__)

resourcesPath = Path(__file__).parent / "resources"
media_folder_path = Path(__file__).parent / "media"


@http_api.post('/api/uploadMediaFile')
def upload_file():
    try:
        if 'media' in request.files:
            print("Handle here.")
            __main__.vlc_handler.stop()
            __main__.vlc_handler.remove_all_media_files()
            filename = __main__.media.save(request.files['media'])
            __main__.vlc_handler.refresh_media_file()
            __main__.vlc_handler.play()
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


def progress_cb(percent: int):
    print("progress %i" % percent)
    __main__.socketio.emit("copy_progress", percent)


@http_api.post('/api/getFileFromUSBDrive')
def get_file_from_usb_drive():
    try:
        # with usbmount package installed
        # the usb drives always mount in /media/usb

        media_file_path = ""

        volumes_list = os.listdir("/media")
        if volumes_list.__len__ == 0:
            raise Exception("No USB drive found")

        temp_raw_files_list = os.listdir("/media/usb")
        temp_raw_files_list.sort()
        # we remove hidden files starting with .
        for file in temp_raw_files_list:
            if file[0] != '.':
                file_path = os.path.join("/media/usb", file)
                # we keep only files, exclude directories
                if os.path.isfile(file_path):
                    file_type = magic.from_file(file_path,
                                                mime=True).split("/")[0]
                    if file_type == "audio" or file_type == "video":
                        media_file_path = file_path
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
                if cmd.poll() != None:
                    if cmd.poll() != 0:
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
        #__main__.vlc_handler.refresh_media_file()
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
        dhcp_process = subprocess.run('ip -4 addr show eth0',
                                      shell=True,
                                      text=True,
                                      capture_output=True)
        if dhcp_process.stdout.find(
                "dynamic") != -1 or dhcp_process.stdout.find("link") != -1:
            dhcp_or_fixed = "DHCP"
        else:
            dhcp_or_fixed = "Fixed IP"
        ip_process = subprocess.run(
            'ip addr show eth0 | grep "inet\\b" | awk \'{print $2}\' | cut -d/ -f1',
            shell=True,
            text=True,
            check=True,
            capture_output=True)
        ip_address = ip_process.stdout.strip()
        netmask_process = subprocess.run(
            'ifconfig eth0 | grep "netmask\\b" | awk \'{print $4}\'',
            shell=True,
            text=True,
            check=True,
            capture_output=True)
        netmask = netmask_process.stdout.strip()
        return {
            "DHCPorFixed": dhcp_or_fixed,
            "ipAddress": ip_address,
            "netmask": netmask
        }
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/setWiredNetwokConfig')
def set_wired_network_config():
    try:
        DHCPorFixed = request.json["DHCPorFixed"]
        ipAddress = request.json["ipAddress"]
        netmask = request.json["netmask"]

        if DHCPorFixed == "DHCP":
            command = f'sudo nmcli con mod eth0 ipv4.method auto && sudo nmcli con mod eth0 ipv4.addresses ""'
        else:
            #the following line will return an Exception if not a valid netmask
            netmask_bit_count = IPv4Network(f'0.0.0.0/{netmask}').prefixlen
            command = f'sudo nmcli con mod eth0 ipv4.method manual ipv4.addresses {ipAddress}/{netmask_bit_count}'

        network_process = subprocess.run(command,
                                         shell=True,
                                         text=True,
                                         check=True,
                                         capture_output=True)

        network_process = subprocess.run(f'sudo nmcli con up eth0',
                                         shell=True,
                                         text=True,
                                         check=True,
                                         capture_output=True)

        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


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
        out = subprocess.run('tr -d " \t\n\r" < /etc/hostname',
                             shell=True,
                             text=True,
                             check=True,
                             capture_output=True)
        return {"hostname": out.stdout.strip()}
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/setHostname')
def set_hostname():
    try:
        out = subprocess.run('sudo raspi-config nonint do_hostname ' +
                             request.json["hostname"],
                             shell=True,
                             text=True,
                             check=True,
                             capture_output=True)
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/reboot')
def reboot():
    try:
        subprocess.run('sudo reboot',
                       shell=True,
                       check=True,
                       capture_output=True)
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/shutdown')
def shutdown():
    try:
        subprocess.run('sudo shutdown now',
                       shell=True,
                       check=True,
                       capture_output=True)
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)
    
@http_api.post('/api/expandFS')
def expandFS():
    try:
        subprocess.run('sudo raspi-config nonint do_expand_rootfs',
                       shell=True,
                       check=True,
                       capture_output=True)
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/setVideoOutput')
def set_video_output():
    try:
        if request.json["videoOutput"] == "HDMI":
            p = resourcesPath / "boot_configs" / "hdmi_config.txt"
        elif request.json["videoOutput"] == "CompositePAL":
            p = resourcesPath / "boot_configs" / "composite_pal_config.txt"
        elif request.json["videoOutput"] == "CompositeNTSC":
            p = resourcesPath / "boot_configs" / "composite_ntsc_config.txt"
        elif request.json["videoOutput"] == "HDMIForce1080p60":
            p = resourcesPath / "boot_configs" / "hdmi_config_force_1080p60.txt"
        else:
            raise Exception("Incorrect request")

        subprocess.run(f'sudo cp {p} /boot/config.txt',
                       shell=True,
                       check=True,
                       capture_output=True)
        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)
    
@http_api.get('/api/getConfigTXT')
def get_config_txt():
    try:
        lines : str = ""
        with open("/boot/config.txt", 'r') as f:
            lines = f.read()
        
        return {"txt" : lines}
    except Exception as e:
        return Response(str(e), status=500)
    
@http_api.post('/api/sendConfigTXT')
def send_config_txt():
    try:
        txt: str = request.json["txt"]
        if txt != "":
            with open("temp_config.txt", 'w') as f:
                f.write(txt)

            cmd = f'sudo cp "temp_config.txt" /boot/config.txt'
            subprocess.run(cmd,
                       shell=True,
                       check=True,
                       capture_output=True)
            
            cmd = f'rm "temp_config.txt"'
            subprocess.run(cmd,
                       shell=True,
                       check=True,
                       capture_output=True)

        return Response(status=200)
    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/setWifiConfig')
def set_wifi_config():
    try:
        ssid = request.json["SSID"]
        password = request.json["pass"]
        hidden = request.json["hidden"]

        if hidden:
            hidden_cmd = "true"
        else:
            hidden_cmd = "false"

        subprocess.run(
            f'sudo nmcli device wifi connect "{ssid}" password "{password}" hidden {hidden_cmd}',
            shell=True,
            text=True,
            check=True,
            capture_output=True)

        return Response(status=200)

    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getIsWifiActive')
def get_is_wifi_active():
    try:
        active = False
        wifi_enabled_out = subprocess.run('nmcli radio wifi',
                                          shell=True,
                                          text=True,
                                          check=True,
                                          capture_output=True)
        if wifi_enabled_out.stdout.find("enabled") != -1:
            active = True
        return {"active": active}

    except Exception as e:
        return Response(str(e), status=500)


@http_api.post('/api/setIsWifiActive')
def set_is_wifi_active():
    try:
        active = request.json["active"]

        if active == "true":
            subprocess.run(f'sudo nmcli radio wifi on',
                           shell=True,
                           text=True,
                           check=True,
                           capture_output=True)
        elif active == "false":
            subprocess.run(f'sudo nmcli radio wifi off',
                           shell=True,
                           text=True,
                           check=True,
                           capture_output=True)

        return Response(status=200)

    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getCurrentWifi')
def get_current_wifi():
    try:
        ssid_out = subprocess.run(
            'iwgetid | awk \'{print $2}\' | cut -c 8- | rev | cut -c 2- | rev',
            shell=True,
            text=True,
            check=True,
            capture_output=True)
        ssid = ssid_out.stdout.strip()

        return {"SSID": ssid}

    except Exception as e:
        return Response(str(e), status=500)


@http_api.get('/api/getTransportStatus')
def get_transport_status():
    try:
        return {"stopped": __main__.vlc_handler.is_stopped}

    except Exception as e:
        return Response(str(e), status=500)