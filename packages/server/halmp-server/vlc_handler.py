import vlc
import os
import sys
import time
from pathlib import Path
import vlc

import __main__

media_folder_path = Path(__file__).parent / "media"

class VLC_Handler():
    def __init__(self):
        args: str = ''
        if sys.platform.startswith("linux"):
            args = ' -A alsa --alsa-audio-device hw:0,0 --input-repeat 999'
        elif sys.platform.startswith("darwin"):
            args = '-V dummy --input-repeat 999'

        self.vlc_instance = vlc.Instance(args)

        self.media_list_player = self.vlc_instance.media_list_player_new()
        self.media_player = self.media_list_player.get_media_player()
        self.refresh_video_file()
        self.media_player.audio_set_volume(__main__.cfg_handler.cfg.volume)
        self.media_player.audio_set_delay(__main__.cfg_handler.cfg.audio_delay)
        self.media_list_player.set_playback_mode(vlc.PlaybackMode.loop)
        self.play()

    def get_video_file(self):
        for file in os.listdir(media_folder_path):
            if file.endswith(".mp4") or file.endswith(".mov"):
                return Path.resolve(media_folder_path / file)
        return None

    def refresh_video_file(self):
        video_file = self.get_video_file()
        if video_file:
            self.media_list = self.vlc_instance.media_list_new([video_file])
            self.media_list_player.set_media_list(self.media_list)

    # play media
    def play(self):
        self.media_list_player.play()

    def pause(self):
        self.media_list_player.pause()

    def restart(self):
        self.media_player.set_time(0)
        self.media_list_player.play()

    def stop(self):
        self.media_list_player.stop()


if __name__ == '__main__':
    vlc = VLC_Handler()
    while True:
        time.sleep(0.1)