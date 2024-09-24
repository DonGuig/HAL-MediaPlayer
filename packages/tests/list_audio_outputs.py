import vlc

vlc_inst = vlc.Instance('-A alsa --input-repeat 999999')

devices = vlc_inst.audio_output_device_list_get("alsa")
if devices:
    mod = devices
    while mod:
        mod = mod.contents
        desc :str = mod.description.decode('utf-8', 'ignore')
        print(desc)        
        mod = mod.next
# free devices
vlc.libvlc_audio_output_device_list_release(devices)
