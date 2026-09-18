import os
from pathlib import Path
import config
import json

config_folder_path = Path(__file__).parent / "resources"
config_file_path = config_folder_path / "config.json"

default_config = {
    "volume" : 100,
    "audio_delay": 0,
    "audio_output":"jack"
}

class ConfigHandler():
    def __init__(self):
        # creat the config forlder if it doesn't exist
        try :
            os.mkdir(config_folder_path)
        except FileExistsError:
            pass
        except Exception as e:
            print("Could not create config folder %s" % e)
            return

        if os.path.exists(config_file_path):
            try:
                with open(config_file_path) as file:
                    self.cfg = config.config_from_json(file.read())
                print("successfully loaded config file :")
                print(self.cfg)
                return
            except Exception as e:
                print(str(e))

        self.cfg = config.config_from_dict(default_config)
        print("Using default config :")
        print(self.cfg)
        self.write_config_to_file()

    def change_config(self, key : str, val: any):
        try:
            self.cfg[key] = val
            self.write_config_to_file()
        except Exception as e:
            print("error writing config to file : %s" % str(e))

    def get_config(self, key):
        return self.cfg[key]

    def write_config_to_file(self):
        with open(config_file_path, 'w') as f:
                f.write(json.dumps(self.cfg.as_dict()))



        
        
