import {
  Grid,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import * as React from "react";
import { useState, useCallback } from "react";
import HttpApiRequests from "src/utils/HttpRequests";

type TCallback = () => void;

type ConfirmDialogProps = {
  open: boolean;
  actionName: string;
  confirmCallback: TCallback;
  cancelCallback: TCallback;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  actionName,
  confirmCallback,
  cancelCallback,
}) => {
  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={cancelCallback}>
      <DialogContent sx={{ p: 2 }}>
        Are you sure you want to {actionName} ?
      </DialogContent>
      <DialogActions sx={{ p: 2 }} disableSpacing={true}>
        <Button onClick={confirmCallback}>Ok</Button>
        <Button onClick={cancelCallback}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

const SystemControl: React.FC = () => {
  const [openRebootDialog, setOpenRebootDialog] = useState<boolean>(false);
  const [openShutdownDialog, setOpenShutdownDialog] = useState<boolean>(false);

  const sendReboot = () => {
    HttpApiRequests
      .post(`/reboot`)
      .then((res) => {
        // setDisplayedDeviceName(res.data.deviceName);
      })
      .catch(() => {
        console.log("error trying to reboot");
      });
  };

  const sendShutdown = () => {
    HttpApiRequests
      .post(`/shutdown`)
      .then((res) => {
        // setDisplayedDeviceName(res.data.deviceName);
      })
      .catch(() => {
        console.log("error trying to shut down");
      });
  };

  const confirmRebootCB = useCallback(() => {
    sendReboot();
    setOpenRebootDialog(false);
  }, [])

  const confirmShutdownCB = useCallback(() => {
    sendShutdown();
    setOpenShutdownDialog(false);
  }, [])

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
          System Control
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={2}
        >
          <Button color="warning" variant="contained" onClick={() => {setOpenRebootDialog(true)}}>
            Reboot
          </Button>
          <Button color="warning" variant="contained" onClick={() => {setOpenShutdownDialog(true)}}>
            Shutdown
          </Button>
        </Stack>
      </Grid>
      <ConfirmDialog
        open={openRebootDialog}
        actionName="reboot"
        confirmCallback={confirmRebootCB}
        cancelCallback={() => {
          setOpenRebootDialog(false);
        }}
      />
      <ConfirmDialog
        open={openShutdownDialog}
        actionName="shutdown"
        confirmCallback={confirmShutdownCB}
        cancelCallback={() => {
          setOpenShutdownDialog(false);
        }}
      />
    </>
  );
};

export default SystemControl;
