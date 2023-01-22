import os
import platform
import sys
import tkinter
from ctypes import c_void_p, cdll
from ctypes.util import find_library as _find
from threading import Thread

import vlc

system = platform.system()

_TKVLC_LIBTK_PATH = 'TKVLC_LIBTK_PATH'
_Tk_Version  =  tkinter.TkVersion

def _find_lib(name, *paths):
    assert os.path.sep == '/'
    # 1. built into Python
    for p in (getattr(sys, 'base_prefix', ''), sys.prefix):
        if p:
            yield p + '/lib/' + name
    # 2. from ctypes.find_library, env variable
    for p in paths:
        if p:  # is not None
            p = os.path.expanduser(p)
            yield p
            if not p.endswith(name):
                yield p + '/' + name
    # 3. the Homebrew basement
    from glob import iglob
    for t in ('/opt', '/usr'):
        t += '/local/Cellar/tcl-tk/*/lib/' + name
        for p in iglob(t):
            yield p

if system == "Darwin":
    # find the accurate Tk lib for Mac
    env = os.environ.get(_TKVLC_LIBTK_PATH, '')
    lib = 'libtk%s.dylib' % (_Tk_Version,)
    for libtk in _find_lib(lib, _find(lib), *env.split(os.pathsep)):
        if libtk and lib in libtk and os.access(libtk, os.F_OK):
            break
    else:  # not found anywhere
        if env:  # bad env?
            t = 'no %s in %%s=%r' % (lib, env)
        else:  # env not set, suggest
            t = 'no %s found, use %%s to set a path' % (lib,)
        raise NameError(t % (_TKVLC_LIBTK_PATH,))

    dylib = cdll.LoadLibrary(libtk)
    _GetNSView = dylib.TkMacOSXGetRootControl
    _GetNSView.restype = c_void_p
    _GetNSView.argtypes = (c_void_p,)
    del dylib


class Window(tkinter.Tk):
    def register(self, player):
        id = self.winfo_id()
        print(id)

        if system == "Darwin":
            player.set_nsobject(_GetNSView(id))
        elif system == "Linux":
            player.set_xwindow(id)
        elif system == "Windows":
            player.set_hwnd(id)


def play(instance, player, path):
    media = instance.media_new_path(path)
    player.set_media(media)
    player.play()


if __name__ == "__main__":
    instance = vlc.Instance()
    player = instance.media_player_new()
    window = Window()
    window.register(player)
    thread = Thread(target=play, args=(instance, player, '/Users/guillaumecouturier/Documents/Programmation/HAL-MediaPlayer/HAL-MediaPlayer/packages/server/halmp-server/media/hammer_snowjob-dbeta-H264.mov'))
    thread.start()
    window.mainloop()