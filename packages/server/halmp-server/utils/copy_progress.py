#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import shutil
import sys
import threading
import time

import eventlet


def getPERCENTprogress(source_path,
                       destination_path,
                       socketio_instance,
                       callback=None):
    #eventlet.sleep(0.5)
    print("in getPERCENTprogress 1")
    print(destination_path)
    while not os.path.exists(destination_path):
        print('waiting for copy to start')
        socketio_instance.sleep(0)
    print("in getPERCENTprogress 2")
    while os.path.getsize(source_path) != os.path.getsize(destination_path):
        percentage = int((float(os.path.getsize(destination_path)) /
                          float(os.path.getsize(source_path))) * 100)
        if callback != None:
            print("calling callback")
            callback(percentage)
        socketio_instance.sleep(0)


def copy_progress(SOURCE, DESTINATION, socketio_instance=None, callback=None):
    if os.path.isdir(DESTINATION):
        dst_file = os.path.join(DESTINATION, os.path.basename(SOURCE))
    else:
        dst_file = DESTINATION

    if callback and socketio_instance:
        print("about to start background task")
        socketio_instance.start_background_task(getPERCENTprogress, SOURCE,
                                                dst_file, socketio_instance,
                                                callback)
        #threading.Thread(name='progress', target=getPERCENTprogress, args=(SOURCE, dst_file, callback)).start()
        #threading.Thread(name='progress', target=shutil.copy, args=(SOURCE, DESTINATION)).start()
        print("about to shutil.copy")
        shutil.copy(SOURCE, DESTINATION)