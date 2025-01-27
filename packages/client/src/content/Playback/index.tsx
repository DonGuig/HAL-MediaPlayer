import * as React from "react";
import { Container, Divider } from "@mui/material";
import Transport from "./Transport";
import AudioControls from "./Audio";
import FileManagement from "./FileManagement";
import { PlaybackContextProvider } from "./PlaybackContext";

const Playback: React.FC = () => {
  return (
    <Container>
      <PlaybackContextProvider>
        <Transport />
        <Divider />
        <AudioControls />
        <Divider />
        <FileManagement />
      </PlaybackContextProvider>
    </Container>
  );
};

export default Playback;
