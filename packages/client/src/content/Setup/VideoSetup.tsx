import {
  Grid,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import axios from "axios";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import globalSnackbar from "src/utils/snackbarUtils";
import _ from "lodash";
import axiosServerAPI from "src/utils/axios";

type VideoOutputType = "Composite" | "HDMI";

const VideoSetup: React.FC = () => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  const setVideoOutput = (type: VideoOutputType) => {
    axiosServerAPI
      .post(`/setVideoOutput`, { videoOutput: type })
      .then(() => {
        globalSnackbar.success("Successfully changed config file");
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

  const handleVideoOutputChange = (type: VideoOutputType) => {
    setVideoOutput(type);
    setOpenDialog(true);
  };

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
          Video Output
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={2}
        >
          <Button variant="outlined" onClick={() => handleVideoOutputChange("HDMI")}>HDMI</Button>
          <Button variant="outlined" onClick={() => handleVideoOutputChange("Composite")}>
            Composite PAL
          </Button>
        </Stack>
      </Grid>
      <Dialog fullWidth maxWidth="sm" open={openDialog}>
        <DialogContent sx={{ p: 2 }}>
          You will need to reboot for changes to take effect
        </DialogContent>
        <DialogActions sx={{ p: 2 }} disableSpacing={true}>
          <Button onClick={() => setOpenDialog(false)}>Ok</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VideoSetup;
