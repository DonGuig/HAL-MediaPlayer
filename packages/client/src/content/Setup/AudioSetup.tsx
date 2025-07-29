import {
  Grid,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from "@mui/material";
import * as React from "react";
import { useEffect, useState, useCallback, useContext } from "react";
import _ from "lodash";
import { OverlayContext } from "src/contexts/OverlayContext";
import HttpApiRequests from "src/utils/HttpRequests";

type audioOutputResponse = {
  audioOutput: AudioOutputType;
};
type AudioOutputType = "jack" | "HDMI" | "USB" | "Hifiberry";

const AudioSetup: React.FC = () => {
  const [audioOutputDisplay, setAudioOutputDisplay] =
    useState<AudioOutputType>("jack");
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);

  const getCurrentAudioOutput = useCallback(() => {
    HttpApiRequests.get<audioOutputResponse>(`/getAudioOutput`)
      .then((res) => {
        setAudioOutputDisplay(res.audioOutput);
      })
      .catch();
  }, [setAudioOutputDisplay]);

  const setCurrentAudioOutput = (type: AudioOutputType) => {
    HttpApiRequests.post(`/setAudioOutput`, { data: { audioOutput: type } })
      .then(() => {
        setTimeout(getCurrentAudioOutput, 500);
      })
      .catch();
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
          <Tooltip title="Remember to edit /boot/config.txt below">
            <ToggleButton value="Hifiberry">Hifiberry</ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Stack>
    </Grid>
  );
};

export default AudioSetup;
