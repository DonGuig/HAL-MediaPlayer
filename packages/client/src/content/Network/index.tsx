import * as React from "react";
import { Box, Chip, Container, Divider, Stack } from "@mui/material";
import WiredEthernet from "./WiredEthernet";
import Hostname from "./Hostname";
import Wifi from "./Wifi";
import { OverlayContext } from "src/contexts/OverlayContext";
import { useContext } from "react";

const Network: React.FC = () => {
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);

  return (
    <Container>
      {overlayActive || readOnlyBoot ? (
        <Stack marginY={4} direction="column" width="100%" alignItems="center" spacing={2}>
          
          <Chip
            color="warning"
            size="small"
            sx={{width:"500px"}}
            label="Changes disabled while Overlay FS active or read-only /boot"
          />
          
        </Stack>
      ) : null}
      <WiredEthernet />
      <Divider />
      <Wifi />
      <Divider />
      <Hostname />
    </Container>
  );
};

export default Network;
