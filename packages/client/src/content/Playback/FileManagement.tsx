import axios from "axios";
import * as React from "react";
import _ from "lodash";
import { useContext, useEffect, useRef, useState } from "react";
import globalSnackbar from "src/utils/snackbarUtils";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Grid,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import axiosServerAPI from "src/utils/axios";
import ChunkedUploady from "@rpldy/chunked-uploady";
import {
  useItemFinalizeListener,
  useItemProgressListener,
  useItemStartListener,
  useItemErrorListener,
  useItemFinishListener,
} from "@rpldy/uploady";
import { asUploadButton, UploadButtonProps } from "@rpldy/upload-button";
import UploadButton from "@rpldy/upload-button";
import { convertBytes } from "src/utils/util";
import { PlaybackContext } from "./PlaybackContext";
import { WebSocketContext } from "src/contexts/WebSocketContext";
import { OverlayContext } from "src/contexts/OverlayContext";
import { SERVER_URL } from "src/ServerURL";

type fileNameResponse = {
  fileName: string;
  fileSize: number;
};

type AvailableSpaceResponse = {
  space: number;
};

interface progressDialogProps {
  type: "Uploading" | "Copying";
  open: boolean;
  progress: number;
  fileInfo: fileNameResponse;
}

const ProgressDialog: React.FC<progressDialogProps> = ({
  type,
  open,
  progress,
  fileInfo,
}) => {
  return (
    <>
      <Dialog fullWidth maxWidth="sm" open={open}>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography>{type}...</Typography>
            <Typography>
              <b>Source file : </b>
              {fileInfo.fileName} ({convertBytes(fileInfo.fileSize)})
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

const FileManagementWithoutUploady: React.FC = () => {
  const [fileName, setFileName] = useState<string>("...");
  const [openProgressDialog, setOpenProgressDialog] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressType, setProgressType] = useState<"Uploading" | "Copying">(
    "Uploading"
  );
  const [fileInfo, setFileInfo] = useState<fileNameResponse>({
    fileName: "waiting...",
    fileSize: 0,
  });

  const [availableSpace, setAvailableSpace] = useState<number>(0);
  const [fileSize, setFileSize] = useState<number>(0);
  const { transportCommandAndUpdateStatus, updateStatus } =
    useContext(PlaybackContext);
  const { socket } = useContext(WebSocketContext);
  const { overlayActive } = useContext(OverlayContext);
  const progressData = useItemProgressListener();


  useItemStartListener((item) => {
    setFileInfo({ fileName: item.file.name, fileSize: item.file.size });
    axiosServerAPI.post("/stop");
    setProgressType("Uploading");
    setOpenProgressDialog(true);
  });

  useItemFinalizeListener((item) => {
    axiosServerAPI.post("/uploadFinalized");
    setOpenProgressDialog(false);
    setFileInfo({ fileName: "waiting...", fileSize: 0 });
    setProgress(0);
    getFileNameAndSize();
    getAvalaibleSpace();
    updateStatus();
  });

  useItemFinishListener((item) => {
    globalSnackbar.success("Media file changed");
  });

  useItemErrorListener((item) => {
    globalSnackbar.error(
      `Problème dans l'envoi du fichier : ${item.uploadResponse}`
    );
  });

  useEffect(() => {
    if (progressData && progressData.completed) {
      setProgress(progressData.completed);
    }
  }, [progressData]);

  const MUIUploadButton = asUploadButton((props:UploadButtonProps) => {
    return (
      <Button {...props} variant="outlined" disabled={overlayActive}>
        Upload file
      </Button>
    );
  });

  const getFileNameAndSize = () => {
    axiosServerAPI
      .get<fileNameResponse>(`/getFileNameAndSize`)
      .then((res) => {
        if (res.data.fileName !== "black_1920.jpg") {
          setFileName(res.data.fileName);
          setFileSize(res.data.fileSize);
        } else {
          setFileName("None");
          setFileSize(0);
        }
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  };

  const getAvalaibleSpace = () => {
    axiosServerAPI
      .get<AvailableSpaceResponse>(`/getAvailableSpace`)
      .then((res) => {
        setAvailableSpace(res.data.space);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  };

  const handleUploadClick = () => {
    transportCommandAndUpdateStatus("/stop");
  };

  const handleGetFromUSBDrive = () => {
    setProgressType("Copying");
    setOpenProgressDialog(true);
    socket.on("copy_progress", (percent) => {
      setProgress(percent);
    });
    axiosServerAPI.post(`/getFileFromUSBDrive`).then(
      (res) => {
        setOpenProgressDialog(false);
        setProgress(0);
        socket.off("copy_progress");
        getFileNameAndSize();
        getAvalaibleSpace();
        updateStatus();
        globalSnackbar.success("Media file changed");
      },
      (err) => {
        setOpenProgressDialog(false);
        setProgress(0);
        socket.off("copy_progress");
        if (axios.isAxiosError(err)) {
          globalSnackbar.error(err.response.data);
        }
      }
    );
  };

  const handleRemoveMediaFile = () => {
    transportCommandAndUpdateStatus("/stop");
    axiosServerAPI.post(`/removeMediaFile`).then(
      (res) => {
        getFileNameAndSize();
        getAvalaibleSpace();
        globalSnackbar.success("Media file deleted");
      },
      (err) => {
        setOpenProgressDialog(false);
        if (axios.isAxiosError(err)) {
          globalSnackbar.error(err.response.data);
        }
      }
    );
  };

  useEffect(() => {
    if (openProgressDialog) {
      socket.on("file_info", (info: fileNameResponse) => {
        setFileInfo(info);
      });
    } else {
      if (typeof socket != "undefined") {
        socket.off("file_info");
      }
      setFileInfo({ fileName: "waiting...", fileSize: 0 });
    }
  }, [openProgressDialog, socket]);

  useEffect(() => {
    getFileNameAndSize();
    getAvalaibleSpace();
  }, []);

  return (
    <>
      <Grid container marginY={2} justifyContent="center" direction="column">
        <Typography variant="h4" align="center" marginY={2}>
          File{" "}
          {overlayActive && (
            <Chip
              color="warning"
              size="small"
              label="Disabled while Overlay FS is active"
            />
          )}
        </Typography>
        <Grid
          container
          margin={1}
          spacing={2}
          direction="row"
          justifyContent="center"
          alignItems="center"
        >
          <Grid>
            <MUIUploadButton onClick={handleUploadClick}/>
          </Grid>
          <Grid>
            <Tooltip
              title={
                "Format a USB drive as ExFAT or FAT32 (MBR partiton map), put ONLY the media file you want to copy on the root, plug it in the RPi and press this button. When done, you can unplug the USB drive."
              }
            >
              <Button
                variant="outlined"
                disabled={overlayActive}
                onClick={handleGetFromUSBDrive}
              >
                Copy from USB Drive
              </Button>
            </Tooltip>
          </Grid>
          <Grid>
            <Button
              variant="outlined"
              color="error"
              disabled={overlayActive}
              onClick={handleRemoveMediaFile}
            >
              Remove current media file
            </Button>
          </Grid>
        </Grid>
        <Grid
          container
          margin={1}
          spacing={2}
          direction="column"
          justifyContent="center"
          alignItems="center"
        >
          <Grid>
            <Box height="100%" alignItems="center">
              <Typography variant="h6">
                <b>Current file : </b>
                {fileName} ({convertBytes(fileSize)})
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Typography variant="h6">
              <b>Available space : </b>
              {overlayActive
                ? "Not available while overlay file system is active"
                : convertBytes(availableSpace)}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <ProgressDialog
        open={openProgressDialog}
        progress={progress}
        type={progressType}
        fileInfo={fileInfo}
      ></ProgressDialog>
    </>
  );
};

const FileManagement = () => {
  return (
    <ChunkedUploady
      destination={{ url: `http://${SERVER_URL}/api/uploadMediaFile` }}
      chunkSize={52428800}
      accept=".mov,.mp4,.mp3,.wav,.flac,.aac,.aiff"
    >
      <FileManagementWithoutUploady />
    </ChunkedUploady>
  );
};

export default FileManagement;
