import { Button, Grid, Typography } from "@mui/material";
import * as React from "react";

import Seek from "./Seek";
import { useContext } from "react";
import { PlaybackContext } from "./PlaybackContext";

const Transport: React.FC = () => {
  const { transportCommandAndUpdateStatus } =
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
    <Grid container marginY={2} justifyContent="center" direction="column">
      <Typography variant="h4" align="center" marginY={2}>Transport</Typography>
      <Grid
        container
        margin={1}
        spacing={2}
        direction="row"
        justifyContent="center"
      >
        <Grid>
          <Button variant="contained" onClick={handleClickPlay}>
            Play
          </Button>
        </Grid>
        <Grid>
          <Button variant="contained" onClick={handleClickPause}>
            Pause
          </Button>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            color="warning"
            onClick={handleClickRestart}
          >
            Restart
          </Button>
        </Grid>
        <Grid>
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
