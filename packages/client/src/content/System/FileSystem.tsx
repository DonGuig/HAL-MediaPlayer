import {
  Grid,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Tooltip,
  Box,
  CircularProgress,
  Chip,
} from "@mui/material";
import axios from "axios";
import _ from "lodash";
import * as React from "react";
import { useState, useCallback, useEffect, useContext } from "react";
import { OverlayContext } from "src/contexts/OverlayContext";
import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";
import { convertBytes } from "src/utils/util";

type sizeType = {
  size: number;
};

const FileSystem: React.FC = () => {
  const [openRebootDialog, setOpenRebootDialog] = useState<boolean>(false);
  const [fsSize, setFsSize] = useState<number>(0);
  const [fileSystemROloading, setFileSystemROloading] =
    useState<boolean>(false);
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);

  const getFSSize = useCallback(() => {
    axiosServerAPI
      .get<sizeType>(`/getFSSize`)
      .then((res) => {
        setFsSize(res.data.size);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  }, [setFsSize]);

  const sendExpandFS = () => {
    axiosServerAPI
      .post(`/expandFS`)
      .then((res) => {
        setOpenRebootDialog(true);
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

  const sendReadOnlyFS = () => {
    setFileSystemROloading(true);
    axiosServerAPI
      .post(`/setReadOnlyFS`)
      .then((res) => {
        setOpenRebootDialog(true);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      })
      .finally(() => {
        setFileSystemROloading(false);
      });
  };

  const sendDisableBootRO = () => {
    axiosServerAPI
      .post(`/disableBootRO`)
      .then((res) => {
        setOpenRebootDialog(true);
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

  const sendDisableOverlay = () => {
    axiosServerAPI
      .post(`/disableOverlayFS`)
      .then((res) => {
        setOpenRebootDialog(true);
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

  useEffect(() => {
    getFSSize();
  }, [getFSSize]);

  return (
    <>
      <Grid
        container
        marginY={2}
        direction="column"
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >
        <Typography variant="h4" margin={2}>
          File System
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={2}
        >
          <Tooltip title="Use this if file system size seems A LOT smaller than it should (typically less than 5 GB)">
            <Button
              color="primary"
              variant="contained"
              disabled={overlayActive || readOnlyBoot}
              onClick={() => {
                sendExpandFS();
              }}
            >
              Expand File System
            </Button>
          </Tooltip>
          <Typography>
            File System Size : {overlayActive ? "N/A" : convertBytes(fsSize)}
          </Typography>
          {(overlayActive ||
            readOnlyBoot) && (
              <Chip
                color="warning"
                size="small"
                label="Disabled while Overlay FS active or read-only /boot"
              />
            )}
        </Stack>
        <Typography variant="h4" margin={2}>
          Read-only file system management
        </Typography>
        <Stack direction="row" spacing={2} marginTop={2}>
          <Box sx={{ position: "relative" }}>
            <Tooltip title="Use this once you are done configuring to avoid SD card corruption in case of power failure. It will both enable overlay file system and read-only /boot.">
              <Button
                color="error"
                variant="contained"
                disabled={fileSystemROloading}
                onClick={() => {
                  sendReadOnlyFS();
                }}
              >
                Enable Read-Only File System
              </Button>
            </Tooltip>

            {fileSystemROloading && (
              <CircularProgress
                size={24}
                sx={{
                  // color: green[500],
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  marginTop: "-12px",
                  marginLeft: "-12px",
                }}
              />
            )}
          </Box>
          <Tooltip title="1st step to get back to a writable file system. Please reboot before the 2nd step.">
            <Button
              color="error"
              variant="outlined"
              onClick={() => {
                sendDisableOverlay();
              }}
            >
              Disable Overlay File System
            </Button>
          </Tooltip>
          <Tooltip title="2nd step to get back to a writable file system.">
            <Button
              color="error"
              variant="outlined"
              onClick={() => {
                sendDisableBootRO();
              }}
            >
              Disable Read-Only /boot
            </Button>
          </Tooltip>
        </Stack>
      </Grid>
      <Dialog fullWidth maxWidth="sm" open={openRebootDialog}>
        <DialogContent sx={{ p: 2 }}>
          You will need to reboot for changes to take effect
        </DialogContent>
        <DialogActions sx={{ p: 2 }} disableSpacing={true}>
          <Button onClick={() => setOpenRebootDialog(false)}>Ok</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileSystem;
