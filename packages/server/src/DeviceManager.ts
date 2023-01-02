import fs from "fs";
import * as path from "path";
import _ from "lodash";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import logger from "./HALLogger.js";
import DeviceConfigSchema from "./schemas/DeviceConfigSchema.js";
import {vlcClient} from "./VLC.js";

// Will contain trailing slash
const _dirname = new URL(".", import.meta.url).pathname;


interface DeviceConfig {
    deviceName: string;
    volume:number;
}

const defaultDeviceConfig: DeviceConfig = {
    deviceName: "Default",
    volume:50
}

const ajv = new Ajv();
addFormats(ajv);

const validateProjectSchema = ajv.compile<DeviceConfig>(DeviceConfigSchema);


class DeviceManager {
  filePath: string;
  protected _proxy: any;
  protected _previousProxy: any;
  autoUpdateFileInterval: NodeJS.Timer | null = null;

  constructor() {
    this.filePath = path.resolve(
        _dirname + "../resources/config/device_config.json"
      );
    this._proxy = defaultDeviceConfig;
    this._previousProxy = _.cloneDeep(this._proxy);

    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(defaultDeviceConfig), {
        flag: "wx",
      });
    } catch (e) {
      if (_.isError(e)) {
        if (e.message.split(":")[0] !== "EEXIST") {
          logger.error(e);
        }
      }
    }

    let data = Buffer.from("");
    try {
      data = fs.readFileSync(this.filePath);
      const temp = JSON.parse(data.toString());
      if (this.dataValidator(temp)) {
        this._proxy = temp;
      } else {
        throw Error("During Init, file does not conform to JSON schema");
      }
    } catch (e) {
      if (_.isError(e)){
        logger.error(e.message);
      }
      logger.error("File is not a valid file in " + this.constructor.name);
      logger.error("reverting to default file");
      fs.writeFileSync(this.filePath, JSON.stringify(defaultDeviceConfig));
    }
    this.enableAutoUpdateFile(true);
  }

  get proxy(): DeviceConfig {
    if (this.dataValidator(this._proxy)) {
      return this._proxy;
    } else {
      throw Error("unexpected error validating the proxy data as Project Data");
    }
  }

  set proxy(input: DeviceConfig) {
    this._proxy = input;
  }

  dataValidator(input: unknown): input is DeviceConfig {
    const res = validateProjectSchema(input);

    if (res) {
      return true;
    } else {
      logger.error(validateProjectSchema.errors);
      return false;
    }
  }

  updateFile() {
    const callback: fs.NoParamCallback = (err) => {
      if (err) {
        logger.error("error writing to File for class " + this.constructor.name);
      } else {
        this._previousProxy = _.cloneDeep(this._proxy);
      }
    };
    const boundCallback = callback.bind(this);
    fs.writeFile(this.filePath, JSON.stringify(this._proxy), boundCallback);
  }

  private enableAutoUpdateFile(enable: boolean): void {
    if (enable) {
      if (this.autoUpdateFileInterval) {
        clearInterval(this.autoUpdateFileInterval);
        this.autoUpdateFileInterval = null;
      }
      this.autoUpdateFileInterval = setInterval(() => {
        if (!(_.isEqual(this._previousProxy, this._proxy))) {
          this.updateFile();
        }
      }, 60000);
    } else {
      if (this.autoUpdateFileInterval) {
        clearInterval(this.autoUpdateFileInterval);
        this.autoUpdateFileInterval = null;
      }
    }
  }

  async setVolume(val: number){
    if (val < 0 || val > 200){
        logger.error("setVolume : volume out of range")
        return
    }
    await vlcClient.setVolumeRaw(Math.round(val*512/200));
    this._proxy.volume = val;
    this.updateFile();
  }

  async getVolume() {
    const rawVolume = await vlcClient.getVolumeRaw()
    return Math.round(rawVolume * 200/512);
  }

  setDeviceName(name: string){
    this._proxy.deviceName = name;
    this.updateFile();
  }
}

export default DeviceManager;
