import axios from "axios";
import * as React from "react";
import _ from "lodash";
import { useContext, useEffect, useState } from "react";


import globalSnackbar from "src/utils/snackbarUtils";
import { Chip, Grid, InputAdornment, TextField, Typography } from "@mui/material";
import axiosServerAPI from "src/utils/axios";
import { OverlayContext } from "src/contexts/OverlayContext";

type volumeResponse = {
  volume: number;
};

type delayResponse = {
  delay: number;
};

const AudioControls: React.FC = () => {
  const [volume, setVolume] = useState<number>(0);
  const [audioDelay, setAudioDelay] = useState<number>(0);
  const { overlayActive } = useContext(OverlayContext);

  const getVolume = () => {
    axiosServerAPI
      .get<volumeResponse>(`/getVolume`)
      .then((res) => {
        setVolume(res.data.volume);
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

  const sendVolumeChange = (vol: number) => {
    axiosServerAPI.post(`/setVolume`, { volume: vol }).then(
      (res) => {
        setTimeout(getVolume, 50);
        return;
      },
      (err) => {
        if (axios.isAxiosError(err)) {
          globalSnackbar.error(err.response.data);
        }
      }
    );
  };

  const getAudioDelay = () => {
    axiosServerAPI
      .get<delayResponse>(`/getAudioDelay`)
      .then((res) => {
        setAudioDelay(res.data.delay / 1000);
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

  const sendAudioDelayChange = (delay: number) => {
    axiosServerAPI.post(`/setAudioDelay`, { delay: delay * 1000 }).then(
      (res) => {
        getAudioDelay();
        return;
      },
      (err) => {
        if (axios.isAxiosError(err)) {
          globalSnackbar.error(err.response.data);
        }
      }
    );
  };

  const handleVolumeChange = (event: React.ChangeEvent<any>) => {
    if (Math.abs(event.target.value - volume) === 1) {
      setVolume(event.target.value);
      sendVolumeChange(event.target.value);
    } else {
      setVolume(event.target.value);
    }
  };

  const handleVolumeBlur = () => {
    sendVolumeChange(volume);
  };

  const handleVolumeKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (event.key === "Enter") {
      sendVolumeChange(volume);
    }
  };

  const handleDelayChange = (event: React.ChangeEvent<any>) => {
    if (Math.abs(event.target.value - audioDelay) === 1) {
      setAudioDelay(event.target.value);
      sendAudioDelayChange(event.target.value);
    } else {
      setAudioDelay(event.target.value);
    }
  };

  const handleDelayBlur = () => {
    sendAudioDelayChange(audioDelay);
  };

  const handleDelayKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
    event
  ) => {
    if (event.key === "Enter") {
      sendAudioDelayChange(audioDelay);
    }
  };

  useEffect(() => {
    getVolume();
    getAudioDelay();
  }, []);

  return (
    <Grid container marginY={2} justifyContent="center">
      <Typography variant="h4">
        Audio{' '}
        {overlayActive && (
          <Chip
            color="warning"
            size="small"
            label="Changes will be lost after reboot while Overlay FS is active"
          />
        )}
      </Typography>
      <Grid
        container
        margin={1}
        spacing={2}
        direction="row"
        justifyContent="center"
      >
        <Grid item>
          <TextField
            id="outlined-number"
            label="Volume (0-200%)"
            size="small"
            sx={{ width: "110px" }}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              inputProps: {
                max: "200",
                min: "0",
                step: "1",
              },
              endAdornment: <InputAdornment position="start">%</InputAdornment>,
            }}
            type="number"
            // inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}}
            value={volume}
            onBlur={handleVolumeBlur}
            onChange={handleVolumeChange}
            onKeyDown={handleVolumeKeyDown}
          />
        </Grid>
        <Grid item>
          <TextField
            id="outlined-number"
            label="Delay"
            type="number"
            size="small"
            sx={{ width: "130px" }}
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              inputProps: {
                step: "1",
              },
              endAdornment: (
                <InputAdornment position="start">msec</InputAdornment>
              ),
            }}
            value={audioDelay}
            onBlur={handleDelayBlur}
            onChange={handleDelayChange}
            onKeyDown={handleDelayKeyDown}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AudioControls;
