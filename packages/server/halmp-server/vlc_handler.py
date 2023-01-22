import vlc
import os
import sys
import time
from pathlib import Path

media_folder_path = Path(__file__).parent / "media"

class VLC_Handler():
    def __init__(self):
        args: str = ''
        if sys.platform.startswith("linux"):
            args = ' -A alsa --alsa-audio-device hw:1,0'
        elif sys.platform.startswith("darwin"):
            args = '-V dummy --input-repeat 999'

        self.vlc_instance = vlc.Instance(args)

        self.media_player = self.vlc_instance.media_player_new()
        video_file = self.get_video_file()
        if video_file:
            self.media = self.vlc_instance.media_new(video_file)
            self.media_player.set_media(self.media)
            # self.last_time = 0
            # self.second_passed_callback = None
            # self.event_manager = self.media_player.event_manager()
            # self.event_manager.event_attach(vlc.EventType.MediaPlayerTimeChanged, self.onTimeChanged)
            self.play()

    def get_video_file(self):
        for file in os.listdir(media_folder_path):
            if file.endswith(".mp4") or file.endswith(".mov"):
                return Path.resolve(media_folder_path / file)
        return None

    # play media
    def play(self):
        self.media_player.play()

    def pause(self):
        self.media_player.pause()

    def restart(self):
        self.media_player.set_time(0)
        self.media_player.play()

    def stop(self):
        self.media_player.stop()

    # def onTimeChanged(self, event):
    #     time = self.media_player.get_time()
    #     if (math.floor(time/1000) != math.floor(self.last_time/1000)):
    #         if (self.second_passed_callback):
    #             self.second_passed_callback(time)
    #         self.last_time = time
        

    # def set_second_passed_callback(self, callback):
    #     self.second_passed_callback = callback




    

# vlc_handler = VLC_Handler()





if __name__ == '__main__':
    vlc = VLC_Handler()
    while True:
        time.sleep(0.1)