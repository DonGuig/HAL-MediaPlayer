from typing import List
import vlc
import os
import sys
import time
from pathlib import Path
import vlc
from urllib.request import url2pathname
from urllib.parse import urlparse

import __main__

media_folder_path = Path(__file__).parent / "media"
black_video_path = Path(__file__).parent / "static_media/black_1920.jpg"



class VLC_Handler():

    def __init__(self):
        args: str = ''
        if sys.platform.startswith("linux"):
            args = '-A alsa --input-repeat 999999'
        elif sys.platform.startswith("darwin"):
            args = '-V dummy --input-repeat 999'

        self.is_stopped = False
        self.vlc_instance = vlc.Instance(args)
        self.media_list_player = self.vlc_instance.media_list_player_new()
        self.media_player = self.media_list_player.get_media_player()
        self.black_image_media_list = self.vlc_instance.media_list_new([black_video_path])
        self.media_list = None
        self.set_current_audio_output(__main__.cfg_handler.get_config("audio_output"))
        self.refresh_media_file()
        self.media_player.audio_set_volume(__main__.cfg_handler.cfg.volume)
        self.media_player.audio_set_delay(__main__.cfg_handler.cfg.audio_delay)
        self.media_list_player.set_playback_mode(vlc.PlaybackMode.loop)
        self.play()

    def get_media_file(self):
        for file in os.listdir(media_folder_path):
            correct_media_file: bool = False
            for extension in __main__.accepted_media_extensions:
                if file.endswith(extension):
                    correct_media_file = True
            if correct_media_file:
                return Path.resolve(media_folder_path / file)
        return None

    def remove_all_media_files(self):
        for file in os.listdir(media_folder_path):
            correct_media_file: bool = False
            for extension in __main__.accepted_media_extensions:
                if file.endswith(extension):
                    correct_media_file = True
            if correct_media_file:
                path =  Path.resolve(media_folder_path / file)
                os.remove(path)
        return None


    def refresh_media_file(self):
        media_file = self.get_media_file()
        if media_file:
            if self.media_list: self.media_list.release()
            self.media_list = self.vlc_instance.media_list_new([media_file])
            self.media_list_player.set_media_list(self.media_list)
        else:
            self.media_list_player.set_media_list(self.black_image_media_list)
            self.is_stopped = True

    # play media
    def play(self):
        if self.is_stopped :
            self.media_list_player.stop()
            if self.media_list != None :
                self.media_list_player.set_media_list(self.media_list)
                self.media_list_player.play()
                time.sleep(0.5)
                self.set_current_audio_output(__main__.cfg_handler.get_config("audio_output"), force_pause=True)
                self.is_stopped=False
        else:
            self.media_list_player.play()
            self.is_stopped=False



    def pause(self):
        self.media_list_player.pause()

    def restart(self):
        self.media_player.set_time(0)
        self.media_list_player.play()

    def stop(self):
        if not self.is_stopped :
            self.media_list_player.stop()
            # self.media_list.release()
            # self.media_list.set_media(self.black_image_media_list)
            # self.media_list_player.play()
            self.media_list_player.set_media_list(self.black_image_media_list)
            self.play()
            self.set_current_audio_output(__main__.cfg_handler.get_config("audio_output"))
            self.is_stopped = True


    def get_audio_outputs_list(self, vlc_inst):
        res = {"jack": b'', "HDMI": b'', "USB": b''}
        devices = vlc_inst.audio_output_device_list_get("alsa")
        if devices:
            mod = devices
            while mod:
                mod = mod.contents
                desc :str = mod.description.decode('utf-8', 'ignore')
                if desc.find("bcm2835 HDMI 1 Direct hardware device without any conversions") != -1:
                    res["HDMI"]=mod.device
                elif desc.find("bcm2835 Headphones Direct hardware device without any conversions") != -1:
                    res["jack"]=mod.device
                elif desc.find("USB Audio Direct hardware device without any conversions") != -1:
                    res["USB"]=mod.device
                mod = mod.next
        # free devices
        vlc.libvlc_audio_output_device_list_release(devices)
        print(res)
        return res

    def set_current_audio_output(self, type, force_pause=False):
        """ type should be "jack" | "HDMI" | "USB" """
        if type != "jack" and type != "HDMI" and type != "USB":
            return
        devices = self.get_audio_outputs_list(self.vlc_instance)
        if devices[type] != b'':
            self.media_player.audio_output_device_set(None, devices[type])
            if self.media_player.is_playing() or force_pause:
                print("pausing after changing audio output")
                self.pause()
                self.media_list_player.play()
            __main__.cfg_handler.change_config("audio_output", type)


    def get_current_audio_output(self):
        ao = self.media_player.audio_output_device_get()
        devices = self.get_audio_outputs_list(self.vlc_instance)
        res=""
        if ao == devices["jack"].decode('utf-8', 'ignore'):
            res="jack"
        elif ao == devices["USB"].decode('utf-8', 'ignore'):
            res="USB"
        elif ao == devices["HDMI"].decode('utf-8', 'ignore'):
            res="HDMI"
        return res

    def get_current_media_filename(self):
        mrl: str = self.media_player.get_media().get_mrl()
        filename = mrl.split("/")[-1]
        return filename
    
    def get_current_media_path(self):
        mrl = self.media_player.get_media().get_mrl()
        return url2pathname(urlparse(mrl).path)

    def get_current_media_file_size(self):
        path = self.get_current_media_path()
        return os.path.getsize(path)
        


if __name__ == '__main__':
    #vlc = VLC_Handler()
    vlc_instance = vlc.Instance()
    media_list_player = vlc_instance.media_list_player_new()
    media_player = media_list_player.get_media_player()
    # video_file = VLC_Handler.get_video_file()
    # if video_file:
    #     media_list = vlc_instance.media_list_new([video_file])
    #     media_list_player.set_media_list(media_list)
    # list devices
    # device_ids: List[bytes] = []
    # mods = vlc_instance.audio_output_device_list_get("alsa")
    # if mods:
    #     index = 0
    #     mod = mods
    #     while mod:
    #         mod = mod.contents
    #         desc = mod.description.decode('utf-8', 'ignore')
    #         dev = mod.device.decode('utf-8', 'ignore')
    #         #name = mod.name.decode('utf-8', 'ignore')
    #         print(f'index = {index}, desc = {desc}, dev={dev}')
    #         device_ids.append(mod.device)

    #         mod = mod.next
    #         index += 1

    # free devices
    # vlc.libvlc_audio_output_device_list_release(mods)

    media_player.audio_output_device_set("alsa",b'hw:CARD=Headphones,DEV=0')
    print(media_player.audio_output_device_get())

    while True:
        time.sleep(0.1)