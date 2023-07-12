import {
  Grid,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import _ from "lodash";
import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";
import { convertBytes } from "src/utils/util";

type sizeType = {
  size: number;
};

const FileSystem: React.FC = () => {
  const [openRebootDialog, setOpenRebootDialog] = useState<boolean>(false);
  const [fsSize, setFsSize] = useState<number>(0);

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
              onClick={() => {
                sendExpandFS();
              }}
            >
              Expand File System
            </Button>
          </Tooltip>
          <Typography>File System Size : {convertBytes(fsSize)}</Typography>
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
