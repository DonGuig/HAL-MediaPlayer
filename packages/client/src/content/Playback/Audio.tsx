import * as React from "react";
import _ from "lodash";
import { useContext, useEffect, useState } from "react";

import {
  Chip,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { OverlayContext } from "src/contexts/OverlayContext";
import HttpApiRequests from "src/utils/HttpRequests";

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
    HttpApiRequests.get<volumeResponse>(`/getVolume`)
      .then((res) => {
        setVolume(res.volume);
      })
      .catch();
  };

  const sendVolumeChange = (vol: number) => {
    if (!vol) {
      vol = 0;
    }
    HttpApiRequests.post(`/setVolume`, { data: { volume: vol } })
      .then((res) => {
        setTimeout(getVolume, 50);
        return;
      })
      .catch();
  };

  const getAudioDelay = () => {
    HttpApiRequests.get<delayResponse>(`/getAudioDelay`)
      .then((res) => {
        setAudioDelay(res.delay / 1000);
      })
      .catch();
  };

  const sendAudioDelayChange = (delay: number) => {
    HttpApiRequests.post(`/setAudioDelay`, { data: { delay: delay * 1000 } })
      .then((res) => {
        getAudioDelay();
        return;
      })
      .catch();
  };

  const handleVolumeChange = (event: React.ChangeEvent<any>) => {
    if (event.target.value >200) {
      
    }
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
    <Grid container marginY={2} justifyContent="center" direction="column">
      <Typography variant="h4" align="center" marginY={2}>
        Audio{" "}
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
        spacing={3}
        direction="row"
        justifyContent="center"
      >
        <Grid>
          <TextField
            id="outlined-number"
            label="Volume (0-200%)"
            size="small"
            sx={{ width: "120px" }}
            type="number"
            // inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}}
            value={volume}
            onBlur={handleVolumeBlur}
            onChange={handleVolumeChange}
            onKeyDown={handleVolumeKeyDown}
            slotProps={{
              input: {
                inputProps: {
                  max: "200",
                  min: "0",
                  step: "1",
                },
                endAdornment: <InputAdornment position="start">%</InputAdornment>,
              },

              inputLabel: {
                shrink: true,
              }
            }} />
        </Grid>
        <Grid>
          <TextField
            id="outlined-number"
            label="Delay"
            type="number"
            size="small"
            sx={{ width: "130px" }}
            value={audioDelay}
            onBlur={handleDelayBlur}
            onChange={handleDelayChange}
            onKeyDown={handleDelayKeyDown}
            slotProps={{
              input: {
                inputProps: {
                  step: "1",
                },
                endAdornment: (
                  <InputAdornment position="start">msec</InputAdornment>
                ),
              },

              inputLabel: {
                shrink: true,
              }
            }} />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AudioControls;
