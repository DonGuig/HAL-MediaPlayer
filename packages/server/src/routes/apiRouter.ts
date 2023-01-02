import express, { Request } from "express";
import fileUpload from "express-fileupload";
import fs from "fs";
import path from "path";
import { URL } from "url"; // in Browser, the URL in native accessible on window
import { deviceManager } from "../app.js";
import logger from "../HALLogger.js";

import vlcManager from "../VLC.js";

// Will contain trailing slash
const _dirname = new URL(".", import.meta.url).pathname;
const videoPath: string = path.join(path.dirname(path.dirname(_dirname)), "/resources/video");
const blackVideoPath: string = path.join(path.dirname(path.dirname(_dirname)), "/resources/utility_video/black_1920.jpg");

const apiRouter = express.Router();

export default apiRouter;

apiRouter.post("/play", (req, res) => {
  logger.info("received play");
  if (!vlcManager.isStopped) {
    vlcManager.play()
      .then(() => res.status(200).send())
      .catch((e) => {
        if (e instanceof Error) {
          res.status(500).send(e.message);
        } else {
          res.sendStatus(500);
        }
      });
  } else {
    vlcManager.restart()
      .then(() => res.status(200).send())
      .catch((e) => {
        if (e instanceof Error) {
          res.status(500).send(e.message);
        } else {
          res.sendStatus(500);
        }
      });
  }
  vlcManager.isStopped = false;
});

apiRouter.post("/pause", (req, res) => {
  logger.info("received pause");
  if (!vlcManager.isStopped) {
    vlcManager.pause()
      .then(() => res.status(200).send())
      .catch((e) => {
        if (e instanceof Error) {
          res.status(500).send(e.message);
        } else {
          res.sendStatus(500);
        }
      });;
  } else {
    res.status(200).send();
  }
});

apiRouter.post("/restart", (req, res) => {
  logger.info("received restart");
  vlcManager.isStopped = false;
  vlcManager.restart()
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
  logger.info("received stop");
  vlcManager.isStopped = true;
  vlcManager.stop()
    .then(() => res.status(200).send())
    .catch((e) => {
      if (e instanceof Error) {
        res.status(500).send(e.message);
      } else {
        res.sendStatus(500);
      }
    })
});

apiRouter.get("/getVolume", (req, res) => {
  const vol: number = 0;
  deviceManager.getVolume().then((result) => {
    res.status(200).send({ volume: result });
  }).catch((e) => {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    } else {
      res.sendStatus(500);
    }

  })
});

apiRouter.post("/setVolume", (req, res) => {
  logger.info("received setVolume");
  const { volume } = req.body;
  deviceManager.setVolume(volume).then((result) => {
    res.status(200).send();
  }).catch((err) => {
    if (err instanceof Error) {
      res.status(500).send(err.message);
    } else {
      res.sendStatus(500);
    }
  })
});

apiRouter.get("/getFileName", (req, res) => {
  try {
    logger.info("received getFileName");
    const videoFileName = vlcManager.getVideoFile()
    if (videoFileName == undefined) {
      res.status(200).send({ fileName: "No video file" });
    } else {
      res.status(200).send({ fileName: videoFileName });
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
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(500).send('No files were uploaded.');
    }

    let uploadedFile = req.files?.file;
    if (uploadedFile !== undefined) {
      const targetFile = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;
      vlcManager.deleteAllVideoFiles();
      const videoFilePath: string = path.join(videoPath, targetFile.name);
      targetFile.mv(videoFilePath, function (err) {
        if (err) {
          return res.status(500).send(err);
        }
        res.status(200).send();
      });
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

apiRouter.get("/getDeviceName", (req, res) => {
  try {
    logger.info("received getDeviceName");
    res.status(200).send({ deviceName: deviceManager.proxy.deviceName });
  } catch (e) {
    if (e instanceof Error) {
      res.status(500).send(e.message);
    } else {
      res.sendStatus(500);
    }
  }
});
