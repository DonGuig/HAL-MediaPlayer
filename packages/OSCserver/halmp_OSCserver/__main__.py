import os
import json
from pathlib import Path
from dotenv import load_dotenv
from pythonosc.osc_server import BlockingOSCUDPServer
from pythonosc.dispatcher import Dispatcher
import requests

dotenv_path = Path.resolve(Path(__file__).parents[3] / '.env')

load_dotenv(dotenv_path=dotenv_path)

server_api_url = f"http://localhost:{os.environ.get('REACT_APP_SERVER_PORT')}/api"


def default_handler(address, *args):
    print(f"(Default handler) {address}: {args}")
    try:
        r = requests.post(server_api_url + address, timeout=0.01
                          )
        r.raise_for_status()
    except Exception as e:
        print(e)


def set_time(address, *args):
    print(f"Set time: {args}")
    try:
        time = float(args[0])       
        r = requests.post(server_api_url + "/set_time",
                          json={"time": time}, timeout=0.01)
        r.raise_for_status()
    except Exception as e:
        print(e)


dispatcher = Dispatcher()
dispatcher.map("/set_time", set_time)
dispatcher.set_default_handler(default_handler)

if __name__ == '__main__':
    print("Starting HAL Media Player OSC Server")
    OSCserver = BlockingOSCUDPServer(("0.0.0.0", 5005), dispatcher)
    OSCserver.serve_forever()
