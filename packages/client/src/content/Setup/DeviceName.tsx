import { Grid, Typography, Stack, Button, TextField } from "@mui/material";
import axios from "axios";
import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import globalSnackbar from "src/utils/snackbarUtils";
import _ from "lodash";
import Emitter from "src/utils/EventEmitter";
import axiosServerAPI from "src/utils/axios";

type deviceNameResponse = {
  deviceName: string;
};

const DeviceName: React.FC = () => {
  const [displayedDeviceName, setDisplayedDeviceName] = useState<string>("...");

  const getDeviceName = useCallback(() => {
    axiosServerAPI
      .get<deviceNameResponse>(
        `/getDeviceName`
      )
      .then((res) => {
        setDisplayedDeviceName(res.data.deviceName);
      })
      .catch(() => {
        console.log("error getting device name");
      });
  }, [setDisplayedDeviceName]);

  const setDeviceName = (name: string) => {
    axiosServerAPI
      .post(
        `/setDeviceName`,
        { deviceName: name }
      )
      .then(() => {
        getDeviceName();
        Emitter.emit("deviceNameChanged", []);
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
    getDeviceName();
  }, [getDeviceName]);

  const handleValidateDeviceName = () => {
    setDeviceName(displayedDeviceName);
  };

  const handleDeviceNameChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (ev) => {
    setDisplayedDeviceName(ev.target.value);
  };

  return (
    <Grid container marginY={2} direction="column" justifyContent="center" alignItems="center">
      <Typography variant="h4" margin={2}>Device Name</Typography>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={2}
      >
        <TextField
          label="Name"
          size="small"
          onChange={handleDeviceNameChange}
          value={displayedDeviceName}
          variant="outlined"
        />
        <Button variant="contained" onClick={handleValidateDeviceName}>
          Valider
        </Button>
      </Stack>
    </Grid>
  );
};

export default DeviceName;
