from typing import List
import vlc
import os
import sys
import time
from pathlib import Path
import vlc

import __main__
from .utils import hdmi_power


media_folder_path = Path(__file__).parent / "media"

# Check if the folder exists
if not os.path.exists(media_folder_path):
    # Create the folder
    os.makedirs(media_folder_path)


class VLC_Handler():

    def __init__(self):
        args: str = ''
        if sys.platform.startswith("linux"):
            # no-modeset: keep the mode the kernel set, or every change of media (stop, play)
            # makes the display lose sync. The resolution comes from video= in cmdline.txt.
            # vout drm_vout: no fallback to the other outputs, one of which exits the process
            # when the display is briefly unavailable
            args = '-A alsa --vout drm_vout --input-repeat 999999 --drm-vout-no-modeset'
        elif sys.platform.startswith("darwin"):
            args = '-V dummy --input-repeat 999'

        self.hdmi_is_off = False
        self.hdmi_off_time = None
        self.vlc_instance = vlc.Instance(args)
        self.media_list_player = self.vlc_instance.media_list_player_new()
        self.media_player = self.media_list_player.get_media_player()
        self.media_file = None
        self.media_list = None
        try:
            self.set_current_audio_output(__main__.cfg_handler.get_config("audio_output"))
        except Exception as e :
            pass
        self.refresh_media_file()
        self.media_player.audio_set_volume(__main__.cfg_handler.cfg.volume)
        self.media_player.audio_set_delay(__main__.cfg_handler.cfg.audio_delay)
        self.media_list_player.set_playback_mode(vlc.PlaybackMode.loop)
        if self.media_list != None:
            self.media_list_player.play()

    def is_stopped(self):
        return self.media_player.get_state() in (
            vlc.State.NothingSpecial, vlc.State.Stopped, vlc.State.Ended, vlc.State.Error)

    def get_media_file(self):
        for file in os.listdir(media_folder_path):
            if __main__.is_accepted_media_file(file):
                return Path.resolve(media_folder_path / file)
        return None

    def remove_all_media_files(self):
        for file in os.listdir(media_folder_path):
            if __main__.is_accepted_media_file(file):
                path =  Path.resolve(media_folder_path / file)
                os.remove(path)
        self.refresh_media_file()
        return None


    def refresh_media_file(self):
        if self.media_list: self.media_list.release()
        self.media_list = None
        self.media_file = self.get_media_file()
        if self.media_file:
            self.media_list = self.vlc_instance.media_list_new([self.media_file])
            self.media_list_player.set_media_list(self.media_list)

    # play media
    def play(self):
        if self.hdmi_is_off:
            self._wake_hdmi()
            if self.hdmi_off_time is not None:
                self._resume_at(self.hdmi_off_time, paused=False)
                return
        if self.media_list == None:
            return
        was_stopped = self.is_stopped()
        self.media_list_player.play()
        if was_stopped:
            # The audio output has to be set again once the media has started
            time.sleep(2.0)
            try:
                self.set_current_audio_output(__main__.cfg_handler.get_config("audio_output"), pause_to_apply=False)
            except Exception as e:
                pass

    def pause(self):
        if not self.is_stopped():
            self.media_list_player.pause()

    def is_paused(self):
        return self.media_player.get_state() == vlc.State.Paused

    def restart(self):
        self.hdmi_off_time = None
        if self.is_stopped():
            self.play()
        else:
            self.media_player.set_time(0)
            self.media_list_player.play()

    def stop(self):
        # With HDMI off, it stays off and the saved position no longer applies
        self.hdmi_off_time = None
        self.media_list_player.stop()

    def hdmi_off(self):
        if self.hdmi_is_off:
            return
        # VLC can't stay paused here: it must stop to close its video output and
        # release the display. The position is restored when HDMI comes back on.
        self.hdmi_off_time = None if self.is_stopped() else max(self.media_player.get_time(), 0)
        self.hdmi_is_off = True
        self.media_list_player.stop()
        hdmi_power.power_down()

    def hdmi_on(self):
        if not self.hdmi_is_off:
            return
        self._wake_hdmi()
        if self.hdmi_off_time is not None:
            self._resume_at(self.hdmi_off_time, paused=True)

    def _wake_hdmi(self):
        hdmi_power.power_up()
        self.hdmi_is_off = False

    def _resume_at(self, time_ms, paused):
        # Muted so nothing is heard between starting the media and seeking back
        self.media_player.audio_set_mute(True)
        self.media_list_player.play()
        deadline = time.monotonic() + 5.0
        while not self.media_player.is_playing() and time.monotonic() < deadline:
            time.sleep(0.05)
        try:
            self.set_current_audio_output(__main__.cfg_handler.get_config("audio_output"))
        except Exception as e:
            pass
        self.media_player.set_time(time_ms)
        if paused:
            # Leave time for the frame at this position to reach the screen
            time.sleep(0.5)
            self.media_player.set_pause(1)
        self.media_player.audio_set_mute(False)

    def get_player_status(self):
        return {
            "stopped": self.is_stopped(),
            "paused": self.is_paused(),
            "time": self.media_player.get_time() / 1000,
            "length": self.media_player.get_length() / 1000,
        }

    def get_audio_outputs_list(self, vlc_inst):
        res = {"jack": b'', "HDMI": b'', "USB": b'', "Hifiberry":b''}
        devices = vlc_inst.audio_output_device_list_get("alsa")
        if devices:
            mod = devices
            while mod:
                mod = mod.contents
                desc :str = mod.description.decode('utf-8', 'ignore')
                # KMS: HDMI audio is the vc4-hdmi card (vc4hdmi on Pi 3, vc4hdmi0/1 on Pi 4/5).
                # Only the hdmi: device works (the hw: ones reject non-IEC958 formats).
                # Devices are listed in card order, so the first HDMI port wins.
                if mod.device.startswith(b"hdmi:CARD=vc4hdmi"):
                    if res["HDMI"] == b'':
                        res["HDMI"]=mod.device
                elif desc.find("bcm2835 Headphones Direct hardware device without any conversions") != -1:
                    res["jack"]=mod.device
                elif desc.find("USB Audio Direct hardware device without any conversions") != -1:
                    res["USB"]=mod.device
                elif desc.find("hifiberry") != -1 and desc.find("Direct hardware device without any conversions") != -1:
                    res["Hifiberry"]=mod.device
                mod = mod.next
        # free devices
        vlc.libvlc_audio_output_device_list_release(devices)
        # print(res)
        return res

    def set_current_audio_output(self, type, pause_to_apply=True):
        """ type should be "jack" | "HDMI" | "USB" | "Hifiberry """
        if type != "jack" and type != "HDMI" and type != "USB" and type!="Hifiberry":
            return
        devices = self.get_audio_outputs_list(self.vlc_instance)
        if devices[type] != b'':
            self.media_player.audio_output_device_set(None, devices[type])
            if pause_to_apply and self.media_player.is_playing():
                print("pausing after changing audio output")
                self.pause()
                self.media_list_player.play()
            __main__.cfg_handler.change_config("audio_output", type)
        else :
            raise Exception("Could not find audio device")


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
        elif ao == devices["Hifiberry"].decode('utf-8', 'ignore'):
            res="Hifiberry"
        return res

    def get_current_media_filename(self):
        return self.media_file.name if self.media_file else None

    def get_current_media_file_size(self):
        return os.path.getsize(self.media_file) if self.media_file else 0


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