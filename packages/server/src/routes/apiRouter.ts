import express, { Request } from "express";
import fileUpload from "express-fileupload";
import fs from "fs";
import path from "path";
import { URL } from "url"; // in Browser, the URL in native accessible on window
import logger from "../HALLogger.js";

import vlcClient from "../VLC.js";

// Will contain trailing slash
const _dirname = new URL(".", import.meta.url).pathname;
const videoPath: string = path.join(path.dirname(path.dirname(_dirname)), "/resources/video");
const blackVideoPath : string = path.join(path.dirname(path.dirname(_dirname)), "/resources/utility_video/black_1920.jpg");

const apiRouter = express.Router();

export default apiRouter;

apiRouter.post("/play", (req, res) => {
  logger.info("received play");
  vlcClient.play().then(() => res.status(200).send()).catch((e) => {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    } else {
      res.sendStatus(500);
    }
  });;
});

apiRouter.post("/pause", (req, res) => {
  logger.info("received pause");
  vlcClient.pause().then(() => res.status(200).send()).catch((e) => {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    } else {
      res.sendStatus(500);
    }
  });;
});

apiRouter.post("/restart", (req, res) => {
  logger.info("received restart");
  vlcClient.setTime(0)
    .then(() => vlcClient.play())
    .then(() => res.status(200).send())
    .catch((e) => {
      if (e instanceof Error) {
        res.status(500).send(e.message);
      } else {
        res.sendStatus(500);
      }
    })
});

apiRouter.post("/stop", (req, res) => {
  logger.info("received restart");
  vlcClient.playFile(blackVideoPath)
    .then(() => vlcClient.setFullscreen(true))
    .then(() => vlcClient.setRepeating(true))
    .then(() => res.status(200).send())
    .catch((e) => {
      if (e instanceof Error) {
        res.status(500).send(e.message);
      } else {
        res.sendStatus(500);
      }
    })
});

apiRouter.get("/getFileName", (req, res) => {
  try {
    logger.info("received getFileName");
    if (!fs.existsSync(videoPath)) {
      fs.mkdirSync(videoPath, { recursive: true });
    }
    let videoFilesList: Array<string> = [];
    fs.readdirSync(videoPath).forEach((file) => {
      if (path.extname(file) == ".mov" || path.extname(file) == ".mp4") {
        videoFilesList.push(file);
      }
    })
    if (videoFilesList.length == 0) {
      res.status(200).send({ fileName: "No video file" });
    } else if (videoFilesList.length > 1) {
      deleteAllVideoFiles();
      throw new Error("Multiple video files found - removing them all");
    } else {
      res.status(200).send({ fileName: videoFilesList[0] });
    }
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    } else {
      res.sendStatus(500);
    }
  }
});

apiRouter.post("/uploadVideoFile", (req, res) => {
  try {
    let uploadedFile = req.files?.file;
    if (uploadedFile !== undefined) {
      const targetFile = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
      deleteAllVideoFiles();
      const videoFilePath: string = path.join(videoPath, targetFile.name);
      fs.writeFile(videoFilePath, targetFile.data, (err) => {
        if (err) {
          logger.error("could not write file to disk")
          throw new Error("could not write file to disk");
        } else {
          res.status(200).send();
        }
      })
    } else {
      logger.error("No uploaded file")
      throw new Error("No uploaded file")
    }
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    } else {
      res.sendStatus(500);
    }
  }
});

const deleteAllVideoFiles = () => {
  let videoFilesList: Array<string> = [];
  fs.readdirSync(videoPath).forEach((file) => {
    if (path.extname(file) == ".mov" || path.extname(file) == ".mp4") {
      videoFilesList.push(file);
    }
  })
  videoFilesList.forEach((file) => {
    fs.rmSync(path.join(videoPath, file));
  })
}