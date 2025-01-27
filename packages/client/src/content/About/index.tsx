import * as React from "react";
import {
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArticleIcon from "@mui/icons-material/Article";
import axiosServerAPI from "src/utils/axios";
import { SERVER_URL } from "src/ServerURL";
import packJSON from "../../../package.json";
import { useState } from "react";

type OSCDictionaryDialogProps = {
  open: boolean;
  onClose: () => void;
};

const OSCDictionaryDialog: React.FC<OSCDictionaryDialogProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog fullWidth maxWidth="sm" open={open}>
      <DialogContent sx={{ p: 2 }}>
        <Stack direction="row">
          <Chip size="small" label="/play" />
          <Chip size="small" label="/pause" />
          <Chip size="small" label="/stop" />
          <Chip size="small" label="/restart" />
          <Chip size="small" label="/reboot" />
          <Chip size="small" label="/shutdown" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }} disableSpacing={true}>
        <Button onClick={() => onClose()}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
};

const About: React.FC = () => {
  const [openOSCDictDialog, setOpenOSCDictDialog] = useState<boolean>(false);

  return (
    <Container>
      <Stack marginY={2} spacing={0.5} justifyContent="center">
        <Typography align="center" variant="h2">
          HAL Media Player
        </Typography>
        <Typography align="center" variant="h5">
          v{packJSON.version}
        </Typography>
        <Typography align="center" variant="h5">
          <Link href="http://www.hal-art.io">
          www.hal-art.io
          </Link>
        </Typography>
      </Stack>
      <Divider />
      <Stack marginY={2} spacing={2} justifyContent="center">
        <Typography align="center" variant="h4">
          Audio
        </Typography>
        <Typography>
          Audio volume can go up to 200%, but values above 100% can lead to
          clipping depending on the media.
        </Typography>
      </Stack>

      <Divider />
      <Stack marginY={2} spacing={2} justifyContent="center">
        <Typography align="center" variant="h4">
          File
        </Typography>
        <Typography>
          Media files have to be encoded in H264, with a maximum resolution of
          1920x1080. Any other format would be decoded in software and likely
          lead to lagging. For encoding, we recommend the use of the Handbrake
          software (free and open source){" "}
          <Link
            href={"http://" + SERVER_URL + "/api/handbrakepreset"}
            variant="body2"
          >
            with the following preset.
            {/* <FileDownloadIcon /> */}
          </Link>
        </Typography>
      </Stack>
      <Divider />
      <Stack marginY={2} spacing={2} justifyContent="center">
        <Typography align="center" variant="h4">
          Network
        </Typography>
        <Typography>
          Please note that changing the "hostname" in the Network tab will
          change the way you access your raspberrypi. After modification of the
          hostname it won't be available through raspberrypi.local, but through{" "}
          <i>yourhostname</i>.local
        </Typography>
      </Stack>
      <Divider />
      <Stack marginY={2} spacing={2} justifyContent="center">
        <Typography align="center" variant="h4">
          Expand File System
        </Typography>
        <Typography>
          When first flashing HAL Media Player's system image to an SD card, you
          should see that the available space reported in the web interface is
          really small compared to your SD card's capacity. This is because you
          have yet to expand the flashed file system to use all the available
          space. You will need to reboot after this.
        </Typography>
      </Stack>
      <Divider />
      <Stack marginY={2} spacing={2} justifyContent="center">
        <Typography align="center" variant="h4">
          Read-only file system
        </Typography>
        <Typography>
          Like any computer, the raspberry pi should not be turned off by just
          cutting power as you want. Indeed, on rare occasions, doing this can
          lead to SD card corruption (in the event that the system was writing
          things on the SD card the moment you unplugged it).
          <br />
          To be able to confidently turn off your HAL Media Player by just
          unplugging power, we recommend to enable the read-only file system.
          After this, any write the system might do will be done in RAM and not
          on the SD card. This means that any change done to the configuration
          of the raspberry and HAL Media Player would be lost after reboot. So
          only put the raspberry in read-only mode once you are done configuring
          it.
        </Typography>
      </Stack>
      <Divider />
      <Stack marginY={2} spacing={2} justifyContent="center">
        <Typography align="center" variant="h4">
          OSC control
        </Typography>
        <Stack direction={"column"}>
          <Typography>
            HAL Media Player can be controlled by OSC messages. Click here to
            see the available commands :{" "}
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                setOpenOSCDictDialog(true);
              }}
            >
              <ArticleIcon />
            </Link>
          </Typography>
        </Stack>
      </Stack>
      <OSCDictionaryDialog
        open={openOSCDictDialog}
        onClose={() => {
          setOpenOSCDictDialog(false);
        }}
      />
    </Container>
  );
};

export default About;
