import fs from "fs";
import path from "path";
import { exec } from "child_process";

import * as VLC from "vlc-client";

import { configManager } from "./app.js";
import logger from "./HALLogger.js";
import { audioDeviceType } from "./ConfigManager.js";

// Will contain trailing slash
const _dirname = new URL(".", import.meta.url).pathname;

// This is from node-vlc-client, config to interface with VLC in HTTP
export const vlcClient = new VLC.Client({
  ip: "localhost",
  port: 8080,
  password: "vlcremote",
});

class VLCManager {
  videoPath: string;
  blackVideoPath: string;
  isStopped: boolean;

  constructor() {
    this.videoPath = path.join(path.dirname(_dirname), "/resources/video");
    this.blackVideoPath = path.join(
      path.dirname(_dirname),
      "/resources/utility_video/black_1920.jpg"
    );
    this.isStopped = true;
    this.init_vlc_command_line();
  }

  init_vlc_command_line() {
    exec("sudo pkill cvlc", (error, stdout, stderr) => {
      if (error) {
        logger.error(error);
      }
      if (stderr) {
        logger.error(stderr);
      }
      logger.info(stdout);
    });
    const videoFilePath = this.getVideoFile();
    let audioDevice: string = "hw:1,0";
    if ((configManager.proxy.audioDevice = "HDMI")) {
      audioDevice = "hw:0,0";
    } else if ((configManager.proxy.audioDevice = "Jack")) {
      audioDevice = "hw:1,0";
    } else if ((configManager.proxy.audioDevice = "USB")) {
      audioDevice = "hw:2,0";
    }
    if (videoFilePath) {
      exec(
        `cvlc --aout alsa --alsa-audio-device ${audioDevice} --intf http --http-password vlcremote ${videoFilePath}`,
        (error, stdout, stderr) => {
          if (error) {
            logger.error(error);
          } else {
            this.isStopped = false;
          }
          if (stderr) {
            logger.error(stderr);
          }
          logger.info(stdout);
        }
      );
    } else {
      logger.info("init_vlc_command_line : no video file to play");
    }
  }

  async play() {
    if (!this.isStopped) {
      await vlcClient.play();
    } else {
      const videoFileName = this.getVideoFile();
      let videoFilePath = "";
      if (videoFileName) {
        this.isStopped = false;
        videoFilePath = path.resolve(this.videoPath, videoFileName);
        await vlcClient
          .setTime(0)
          .then(() => vlcClient.playFile(videoFilePath))
          .then(() => vlcClient.setFullscreen(true))
          .then(() => vlcClient.setRepeating(true));
      }
    }
  }

  async pause() {
    if (!this.isStopped) {
      await vlcClient.pause();
    }
  }

  async restart() {
    const videoFileName = this.getVideoFile();
    let videoFilePath = "";
    if (videoFileName) {
      this.isStopped = false;
      videoFilePath = path.resolve(this.videoPath, videoFileName);
      await vlcClient
        .playFile(videoFilePath)
        .then(() => vlcClient.setTime(0))
        .then(() => vlcClient.setFullscreen(true))
        .then(() => vlcClient.setRepeating(true));
    }
  }

  async stop() {
    this.isStopped = true;
    await vlcClient
      .playFile(this.blackVideoPath)
      .then(() => vlcClient.setFullscreen(true))
      .then(() => vlcClient.setRepeating(true));
  }

  async getTime() {
    let time: number = 0;
    let length: number = 0;
    time = await vlcClient.getTime();
    length = await vlcClient.getLength();
    return { time, length };
  }

  async setTime(val: number) {
    await vlcClient.setTime(val);
  }

  async getVolume() {
    let rawVol: number;
    rawVol = await vlcClient.getVolumeRaw();
    return Math.round((rawVol * 200) / 512);
  }

  async setVolume(val: number) {
    if (val < 0 || val > 200) {
      logger.error("setVolume : volume out of range");
      return;
    }
    await vlcClient.setVolumeRaw(Math.round((val * 512) / 200));
  }

  deleteAllVideoFiles() {
    let videoFilesList: Array<string> = [];
    fs.readdirSync(this.videoPath).forEach((file) => {
      if (path.extname(file) == ".mov" || path.extname(file) == ".mp4") {
        videoFilesList.push(file);
      }
    });
    videoFilesList.forEach((file) => {
      fs.rmSync(path.join(this.videoPath, file));
    });
  }

  getVideoFile(): string | undefined {
    if (!fs.existsSync(this.videoPath)) {
      fs.mkdirSync(this.videoPath, { recursive: true });
    }
    let videoFilesList: Array<string> = [];
    fs.readdirSync(this.videoPath).forEach((file) => {
      if (path.extname(file) == ".mov" || path.extname(file) == ".mp4") {
        videoFilesList.push(file);
      }
    });
    if (videoFilesList.length > 1) {
      this.deleteAllVideoFiles();
      logger.error("Multiple video files found - removing them all");
      videoFilesList = [];
    }
    if (videoFilesList.length > 0) {
      return videoFilesList[0];
    } else {
      return undefined;
    }
  }
}

export default VLCManager;
