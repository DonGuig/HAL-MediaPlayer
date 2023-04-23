import axios from "axios";
import * as React from "react";
import _ from "lodash";
import { ChangeEvent, useContext, useEffect, useRef, useState } from "react";
import globalSnackbar from "src/utils/snackbarUtils";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import axiosServerAPI from "src/utils/axios";
import { convertBytes } from "src/utils/util";
import { PlaybackContext } from "./PlaybackContext";
import { WebSocketContext } from "src/contexts/WebSocketContext";

type fileNameResponse = {
  fileName: string;
  fileSize: number;
};

type AvailableSpaceResponse = {
  space: number;
};

const FileManagement: React.FC = () => {
  const [fileName, setFileName] = useState<string>("...");
  const [openUploadProgressDialog, setOpenUploadProgressDialog] = useState<boolean>(false);
  const [openUSBProgressDialog, setOpenUSBProgressDialog] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [USBcopyProgress, setUSBCopyProgress] = useState<number>(0);
  const [availableSpace, setAvailableSpace] = useState<number>(0);
  const [fileSize, setFileSize] = useState<number>(0);
  const { transportCommandAndUpdateStatus, updateStatus } = useContext(PlaybackContext);
  const { socket } = useContext(WebSocketContext);


  const fileUploadButtonRef = useRef<HTMLInputElement>();

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

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files;
    if (file !== null) {
      axiosServerAPI
        .post("/stop");
      setOpenUploadProgressDialog(true);
      const formData = new FormData();
      formData.append("media", file[0], file[0].name);
      axiosServerAPI
        .post(`/uploadMediaFile`, formData, {
          onUploadProgress: (event) => {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          },
        })
        .then(
          (res) => {
            setOpenUploadProgressDialog(false);
            setUploadProgress(0);
            getFileNameAndSize();
            getAvalaibleSpace();
            updateStatus();
            globalSnackbar.success("Media file changed");
          },
          (err) => {
            setOpenUploadProgressDialog(false);
            setUploadProgress(0);
            if (axios.isAxiosError(err)) {
              globalSnackbar.error(
                `Problème dans l'envoi du fichier : ${err.response.data}`
              );
            }
          }
        );
    }
  };

  const handleGetFromUSBDrive = () => {
    setOpenUSBProgressDialog(true)
    socket.on("copy_progress", (percent) => {
      setUSBCopyProgress(percent);
    })
    axiosServerAPI.post(`/getFileFromUSBDrive`).then(
      (res) => {
        setOpenUSBProgressDialog(false);
        setUSBCopyProgress(0);
        socket.off("copy_progress")
        getFileNameAndSize();
        getAvalaibleSpace();
        updateStatus();
        globalSnackbar.success("Media file changed");
      },
      (err) => {
        setOpenUSBProgressDialog(false);
        setUSBCopyProgress(0);
        socket.off("copy_progress")
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
        setOpenUploadProgressDialog(false);
        if (axios.isAxiosError(err)) {
          globalSnackbar.error(err.response.data);
        }
      }
    );
  };

  useEffect(() => {
    getFileNameAndSize();
    getAvalaibleSpace();
  }, []);

  return (
    <>
      <Grid container marginY={2} justifyContent="center">
        <Typography variant="h4">File</Typography>
        <Grid
          container
          margin={1}
          spacing={2}
          direction="row"
          justifyContent="center"
          alignItems="center"
        >
          <Grid item>
            <input
              type="file"
              ref={fileUploadButtonRef}
              hidden
              accept="mov mp4 mp3 wav flac aac aiff"
              onChange={handleUpload}
              onClick={() => {
                fileUploadButtonRef.current.value = "";
              }}
            />
            <label htmlFor="upload-file-input">
              <Button
                variant="outlined"
                onClick={() => {
                  if (fileUploadButtonRef.current) {
                    fileUploadButtonRef.current.click();
                  }
                }}
              >
                Upload file
              </Button>
            </label>
          </Grid>
          <Grid item>
            <Button variant="outlined" onClick={handleGetFromUSBDrive}>
              Get from USB Drive
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="error"
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
          <Grid item>
            <Box height="100%" alignItems="center">
              <Typography variant="h6">
                <b>Current file : </b>
                {fileName} ({convertBytes(fileSize)})
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Typography variant="h6">
              <b>Available space : </b>
              {convertBytes(availableSpace)}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
      <Dialog fullWidth maxWidth="sm" open={openUploadProgressDialog}>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography>Uploading...</Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Stack>
        </DialogContent>
      </Dialog>
      <Dialog fullWidth maxWidth="sm" open={openUSBProgressDialog}>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography>Copying...</Typography>
            <LinearProgress variant="determinate" value={USBcopyProgress} />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileManagement;
