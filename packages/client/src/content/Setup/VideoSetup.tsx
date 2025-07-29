import {
  Grid,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Tooltip,
  TextField,
  Link,
  Alert,
} from "@mui/material";
import * as React from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import globalSnackbar from "src/utils/snackbarUtils";
import _ from "lodash";
import { OverlayContext } from "src/contexts/OverlayContext";
import HttpApiRequests from "src/utils/HttpRequests";

type VideoOutputType =
  | "CompositePAL"
  | "CompositeNTSC"
  | "HDMI"
  | "HDMIForce1080p60";

type ConfigEditorProps = {
  open: boolean;
  closeFunc: () => void;
  rebootDialogFunc: Function;
};

type configTXTType = {
  txt: string;
};

const ConfigEditorDialog: React.FC<ConfigEditorProps> = ({
  open,
  closeFunc,
  rebootDialogFunc,
}) => {
  const [configTXT, setConfigTXT] = useState<string>("");

  const getConfigTXT = useCallback(() => {
    HttpApiRequests.get<configTXTType>(`/getConfigTXT`)
      .then((res) => {
        setConfigTXT(res.txt);
      })
      .catch();
  }, [setConfigTXT]);

  const sendConfigTXT = () => {
    HttpApiRequests.post(`/sendConfigTXT`, { data: { txt: configTXT } })
      .then(() => {
        globalSnackbar.success("Successfully changed config file");
        rebootDialogFunc();
      })
      .catch();
  };

  const handleOkClick = () => {
    sendConfigTXT();
    closeFunc();
  };

  useEffect(() => {
    if (open) {
      getConfigTXT();
    }
  }, [getConfigTXT, open]);

  return (
    <Dialog fullWidth maxWidth="sm" open={open}>
      <DialogContent sx={{ p: 2 }}>
        <Stack
          direction="column"
          spacing={2}
          alignItems="center"
          justifyContent="center"
        >
          <Alert severity="warning">
            For advanced users. Refer to{" "}
            <Link
              target="_blank"
              rel="noopener"
              href="https://www.raspberrypi.com/documentation/computers/legacy_config_txt.html#legacy-options"
            >
              this webpage
            </Link>
            .
          </Alert>
          <TextField
            fullWidth
            multiline
            maxRows={20}
            value={configTXT}
            onChange={(evt) => setConfigTXT(evt.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }} disableSpacing={true}>
        <Button onClick={closeFunc}>Cancel</Button>
        <Button onClick={handleOkClick}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
};

const VideoSetup: React.FC = () => {
  const [openRebootDialog, setOpenRebootDialog] = useState<boolean>(false);
  const [openConfEditorDialog, setOpenConfEditorDialog] =
    useState<boolean>(false);
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);

  const setVideoOutput = (type: VideoOutputType) => {
    HttpApiRequests.post(`/setVideoOutput`, { data: { videoOutput: type } })
      .then(() => {
        globalSnackbar.success("Successfully changed config file");
      })
      .catch();
  };

  const handleVideoOutputChange = (type: VideoOutputType) => {
    setVideoOutput(type);
    setOpenRebootDialog(true);
  };

  return (
    <>
      <Grid
        container
        marginY={2}
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <Typography variant="h4" margin={2}>
          Video Output
        </Typography>
        <Typography variant="body2" marginBottom={2}>
          Clicking on one of these button will remove any manual customization
          you did (i.e. Hifiberry customization)
        </Typography>
        <Stack
          direction="column"
          spacing={2}
          alignItems="center"
          justifyContent="center"
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
          >
            <Button
              variant="outlined"
              disabled={overlayActive || readOnlyBoot}
              onClick={() => handleVideoOutputChange("HDMI")}
            >
              HDMI
            </Button>
            <Tooltip title="Useful to force the HDMI output on, for exemple to start the RPi before the connected screen turns on.">
              <Button
                variant="outlined"
                disabled={overlayActive || readOnlyBoot}
                onClick={() => handleVideoOutputChange("HDMIForce1080p60")}
              >
                HDMI force 1080p60
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              disabled={overlayActive || readOnlyBoot}
              onClick={() => handleVideoOutputChange("CompositePAL")}
            >
              Composite PAL
            </Button>
            <Button
              variant="outlined"
              disabled={overlayActive || readOnlyBoot}
              onClick={() => handleVideoOutputChange("CompositeNTSC")}
            >
              Composite NTSC
            </Button>
          </Stack>
          <Button
            variant="contained"
            color="primary"
            sx={{ width: "200px" }}
            disabled={overlayActive || readOnlyBoot}
            onClick={() => setOpenConfEditorDialog(true)}
          >
            Edit /boot/config.txt
          </Button>
        </Stack>
      </Grid>
      <Dialog fullWidth maxWidth="sm" open={openRebootDialog}>
        <DialogContent sx={{ p: 2 }}>
          You will need to reboot for changes to take effect
        </DialogContent>
        <DialogActions sx={{ p: 2 }} disableSpacing={true}>
          <Button onClick={() => setOpenRebootDialog(false)}>Ok</Button>
        </DialogActions>
      </Dialog>
      <ConfigEditorDialog
        open={openConfEditorDialog}
        closeFunc={() => setOpenConfEditorDialog(false)}
        rebootDialogFunc={() => {
          setOpenRebootDialog(true);
        }}
      />
    </>
  );
};

export default VideoSetup;
