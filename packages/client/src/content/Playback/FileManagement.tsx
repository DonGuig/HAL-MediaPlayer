import axios from "axios";
import * as React from "react";
import _ from "lodash";
import { ChangeEvent, useEffect, useRef, useState } from "react";
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

type fileNameResponse = {
  fileName: string;
};

const FileManagement: React.FC = () => {
  const [fileName, setFileName] = useState<string>("...");
  const [openProgressDialog, setOpenProgressDialog] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileUploadButtonRef = useRef<HTMLInputElement>();

  const getFileName = () => {
    axiosServerAPI
      .get<fileNameResponse>(`/getFileName`)
      .then((res) => {
        setFileName(res.data.fileName);
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
      setOpenProgressDialog(true);
      const formData = new FormData();
      formData.append("media", file[0], file[0].name);
      axiosServerAPI
        .post(`/uploadVideoFile`, formData, {
          onUploadProgress: (event) => {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          },
        })
        .then(
          (res) => {
            setOpenProgressDialog(false);
            getFileName();
            globalSnackbar.success("Video file changed");
          },
          (err) => {
            setOpenProgressDialog(false);
            if (axios.isAxiosError(err)) {
              globalSnackbar.error(
                `Problème dans l'envoi du fichier : ${err.response.data}`
              );
            }
          }
        );
    }
  };

  useEffect(() => {
    getFileName();
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
              accept="mov mp4 mp3 wav flac aac"
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
            <Box height="100%" alignItems="center">
              <Typography variant="h6">{fileName}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Grid>
      <Dialog fullWidth maxWidth="sm" open={openProgressDialog}>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography>Uploading...</Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileManagement;
