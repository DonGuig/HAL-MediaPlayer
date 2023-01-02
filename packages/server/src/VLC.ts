import fs from "fs";
import path from "path";

import * as VLC from "vlc-client"

import { deviceManager } from "./app.js";
import logger from "./HALLogger.js";

// Will contain trailing slash
const _dirname = new URL(".", import.meta.url).pathname;

export const vlcClient = new VLC.Client({
    ip: "localhost",
    port: 8080,
    password: "vlcremote"
});



class VLCManager {
    videoPath: string
    blackVideoPath: string;
    isStopped: boolean;

    constructor() {
        this.videoPath = path.join(path.dirname(_dirname), "/resources/video");
        this.blackVideoPath = path.join(path.dirname(_dirname), "/resources/utility_video/black_1920.jpg");
        this.isStopped = true;
    }

    async play() {
        if (!this.isStopped) {
            await vlcClient.play()
        } else {
            const videoFileName = this.getVideoFile();
            let videoFilePath = "";
            if (videoFileName) {
                this.isStopped = false;
                videoFilePath = path.resolve(this.videoPath, videoFileName);
                await vlcClient.setTime(0)
                    .then(() => vlcClient.playFile(videoFilePath))
                    .then(() => vlcClient.setFullscreen(true))
                    .then(() => vlcClient.setRepeating(true))
            }
        }
    }

    async pause() {
        if (!this.isStopped) {
            await vlcClient.pause()
        }
    }

    async restart() {
        const videoFileName = this.getVideoFile();
        let videoFilePath = "";
        if (videoFileName) {
          this.isStopped = false;
          videoFilePath = path.resolve(this.videoPath, videoFileName);
          await vlcClient.playFile(videoFilePath)
            .then(() => vlcClient.setTime(0))   
            .then(() => vlcClient.setFullscreen(true))
            .then(() => vlcClient.setRepeating(true))
        }
    }

    async stop(){
        this.isStopped = true;
        await vlcClient.playFile(this.blackVideoPath)
          .then(() => vlcClient.setFullscreen(true))
          .then(() => vlcClient.setRepeating(true))      
    }

    deleteAllVideoFiles() {
        let videoFilesList: Array<string> = [];
        fs.readdirSync(this.videoPath).forEach((file) => {
            if (path.extname(file) == ".mov" || path.extname(file) == ".mp4") {
                videoFilesList.push(file);
            }
        })
        videoFilesList.forEach((file) => {
            fs.rmSync(path.join(this.videoPath, file));
        })
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
        })
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

const vlcManager = new VLCManager();

export default vlcManager;
