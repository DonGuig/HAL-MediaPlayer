import { Button, Grid, Typography } from "@mui/material";
import axios from "axios";
import * as React from "react";
import _ from "lodash";

import globalSnackbar from "src/utils/snackbarUtils";
import Seek from "./Seek";
import { useContext, useEffect, useState } from "react";
import axiosServerAPI from "src/utils/axios";
import { PlaybackContext } from "./PlaybackContext";

const Transport: React.FC = () => {
  const { transportCommandAndUpdateStatus, updateStatus } =
    useContext(PlaybackContext);

  const handleClickPlay = () => {
    transportCommandAndUpdateStatus("/play");
  };

  const handleClickPause = () => {
    transportCommandAndUpdateStatus("/pause");
  };

  const handleClickRestart = () => {
    transportCommandAndUpdateStatus("/restart");
  };

  const handleClickStop = () => {
    transportCommandAndUpdateStatus("/stop");
  };

  return (
    <Grid container marginY={2} justifyContent="center">
      <Typography variant="h4">Transport</Typography>
      <Grid
        container
        margin={1}
        spacing={2}
        direction="row"
        justifyContent="center"
      >
        <Grid item>
          <Button variant="contained" onClick={handleClickPlay}>
            Play
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" onClick={handleClickPause}>
            Pause
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="warning"
            onClick={handleClickRestart}
          >
            Restart
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="error" onClick={handleClickStop}>
            Stop
          </Button>
        </Grid>
      </Grid>
      <Seek />
    </Grid>
  );
};

export default Transport;
