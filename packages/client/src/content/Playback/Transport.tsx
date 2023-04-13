import { Button, Grid, Typography } from "@mui/material";
import axios from "axios";
import * as React from "react";
import _ from "lodash";

import globalSnackbar from "src/utils/snackbarUtils";
import Seek from "./Seek";
import { useEffect, useState } from "react";
import axiosServerAPI from "src/utils/axios";

type TransportStatusResponse = { stopped: boolean };

const Transport: React.FC = () => {
  const [stopped, setStopped] = useState<boolean>(false);

  const getTransportStatus = () => {
    axiosServerAPI
      .get<TransportStatusResponse>(`/getTransportStatus`)
      .then((res) => setStopped(res.data.stopped))
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  };

  const handleClickPlay = () => {
    axiosServerAPI
      .post(`/play`)
      .then(() => getTransportStatus())
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  };

  const handleClickPause = () => {
    axiosServerAPI
      .post(`/pause`)
      .then(() => getTransportStatus())
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  };

  const handleClickRestart = () => {
    axiosServerAPI
      .post(`/restart`)
      .then(() => getTransportStatus())
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  };

  const handleClickStop = () => {
    axiosServerAPI
      .post(`/stop`)
      .then(() => getTransportStatus())
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
    getTransportStatus();
  }, []);

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
      <Seek stopped={stopped} />
    </Grid>
  );
};

export default Transport;
