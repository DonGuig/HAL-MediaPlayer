import {
  Grid,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import axios from "axios";
import * as React from "react";
import { useEffect, useState, useCallback, useContext } from "react";
import globalSnackbar from "src/utils/snackbarUtils";
import _ from "lodash";
import axiosServerAPI from "src/utils/axios";
import { OverlayContext } from "src/contexts/OverlayContext";

type audioOutputResponse = {
  audioOutput: AudioOutputType;
};
type AudioOutputType = "jack" | "HDMI" | "USB";

const AudioSetup: React.FC = () => {
  const [audioOutputDisplay, setAudioOutputDisplay] = useState<AudioOutputType>("jack");
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);

  const getCurrentAudioOutput = useCallback(() => {
    axiosServerAPI
      .get<audioOutputResponse>(`/getAudioOutput`)
      .then((res) => {
        setAudioOutputDisplay(res.data.audioOutput);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  }, [setAudioOutputDisplay]);

  const setCurrentAudioOutput = (type: AudioOutputType) => {
    axiosServerAPI
      .post(`/setAudioOutput`, { audioOutput: type })
      .then(() => {
        setTimeout(getCurrentAudioOutput, 500);
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
    getCurrentAudioOutput();
  }, [getCurrentAudioOutput]);

  const handleAudioOutputChange = (
    event: React.MouseEvent<HTMLElement>,
    type: AudioOutputType
  ) => {
    if (type !== null) {
      setCurrentAudioOutput(type);
    }
  };

  return (
    <Grid
      container
      marginY={2}
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Typography variant="h4" margin={2}>
        Audio Output
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={2}
      >
        <ToggleButtonGroup
          value={audioOutputDisplay}
          exclusive
          disabled={overlayActive || readOnlyBoot}
          onChange={handleAudioOutputChange}
        >
          <ToggleButton value="jack">Headphone Jack</ToggleButton>
          <ToggleButton value="HDMI">HDMI</ToggleButton>
          <ToggleButton value="USB">USB Audio</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Grid>
  );
};

export default AudioSetup;
