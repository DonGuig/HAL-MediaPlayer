import * as React from "react";
import { Chip, Container, Divider, Stack } from "@mui/material";

import AudioSetup from "./AudioSetup";
import VideoSetup from "./VideoSetup";
import { useContext } from "react";
import { OverlayContext } from "src/contexts/OverlayContext";
import HDMIOnOff from "./HDMIOnOff";

const Setup: React.FC = () => {
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);

  return (
    <Container>
      {overlayActive || readOnlyBoot ? (
        <Stack
          marginY={4}
          direction="column"
          width="100%"
          alignItems="center"
          spacing={2}
        >
          <Chip
            color="warning"
            size="small"
            sx={{ width: "500px" }}
            label="Changes disabled while Overlay FS active or read-only /boot"
          />
        </Stack>
      ) : null}
      <AudioSetup />
      <Divider />
      <VideoSetup />
      <Divider />
      <HDMIOnOff />
    </Container>
  );
};

export default Setup;
