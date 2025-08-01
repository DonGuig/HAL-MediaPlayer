import {
  Grid,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import _ from "lodash";
import * as React from "react";
import { useState, useCallback } from "react";
import { OverlayContext } from "src/contexts/OverlayContext";
import HttpApiRequests from "src/utils/HttpRequests";

type TCallback = () => void;

type ConfirmDialogProps = {
  open: boolean;
  confirmCallback: TCallback;
  cancelCallback: TCallback;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  confirmCallback,
  cancelCallback,
}) => {
  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={cancelCallback}>
      <DialogContent sx={{ p: 2 }}>
        Are you sure you want to factory reset the device ? Hostname will be set
        back to raspberrypi, known wifis will be deleted, media file deleted,
        ethernet set to DHCP, audio settings resetted. Device will be rebooted.
      </DialogContent>
      <DialogActions sx={{ p: 2 }} disableSpacing={true}>
        <Button onClick={confirmCallback}>Ok</Button>
        <Button onClick={cancelCallback}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

const FactoryReset: React.FC = () => {
  const [openResetDialog, setOpenResetDialog] = useState<boolean>(false);
  const { overlayActive, readOnlyBoot } = React.useContext(OverlayContext);

  const sendFactoryReset = () => {
    HttpApiRequests.post(`/factory_reset`).catch();
  };

  const confirmResetCB = useCallback(() => {
    sendFactoryReset();
    setOpenResetDialog(false);
  }, []);

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
          Factory Reset
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={2}
        >
          <Button
            color="error"
            variant="contained"
            disabled={overlayActive || readOnlyBoot}
            onClick={() => {
              setOpenResetDialog(true);
            }}
          >
            Factory Reset
          </Button>
          {(overlayActive || readOnlyBoot) && (
            <Chip
              color="warning"
              size="small"
              label="Disabled while Overlay FS active or read-only /boot"
            />
          )}
        </Stack>
      </Grid>
      <ConfirmDialog
        open={openResetDialog}
        confirmCallback={confirmResetCB}
        cancelCallback={() => {
          setOpenResetDialog(false);
        }}
      />
    </>
  );
};

export default FactoryReset;
