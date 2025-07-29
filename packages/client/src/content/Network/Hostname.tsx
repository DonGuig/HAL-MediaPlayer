import * as Yup from "yup";
import { useFormik } from "formik";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import * as React from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import _ from "lodash";


import globalSnackbar from "src/utils/snackbarUtils";
import Emitter from "src/utils/EventEmitter";
import { OverlayContext } from "src/contexts/OverlayContext";
import HttpApiRequests from "src/utils/HttpRequests";

type HostnameConfig = {
  hostname: string;
};

const Hostname: React.FC = () => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);

  const formik = useFormik<HostnameConfig>({
    initialValues: {
      hostname: "raspberrypi",
    },
    validationSchema: Yup.object().shape({
      hostname: Yup.string()
        .required("Hostname is required")
        .matches(
          /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
          {
            message: "Incorrect hostname format",
            excludeEmptyString: true,
          }
        ),
    }),
    onSubmit: async (
      values,
      { resetForm, setErrors, setStatus, setSubmitting }
    ) => {
      try {
        let toSend = {
          hostname: formik.values.hostname,
        };
        await setHostname(toSend);
        setStatus({ success: true });
        setSubmitting(false);
        setOpenDialog(true);
      } catch (err) {
        setStatus({ success: false });
        setSubmitting(false);
      }
    },
  });

  const getHostname = useCallback(() => {
    HttpApiRequests
      .get<HostnameConfig>("/getHostname")
      .then((res) => {
        formik.setFieldValue("hostname", res.hostname);
      })
      .catch();
  }, [formik]);

  async function setHostname(hn: HostnameConfig) {
    HttpApiRequests
      .post<HostnameConfig>("/setHostname", {data: hn})
      .then((res) => {
        getHostname();
        Emitter.emit("hostnameChanged", []);
      })
      .catch();
  }

  useEffect(() => {
    getHostname();
  }, []);

  return (
    <>
      <Stack marginY={4} direction="column" width="100%">
        <Typography variant="h4" align="center">
          Hostname
        </Typography>
        <Grid
          container
          margin={2}
          spacing={3}
          direction="row"
          justifyContent="center"
          alignItems="center"
          width="100%"
        >
          <form
            onSubmit={formik.handleSubmit}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Grid margin={1}>
              <TextField
                error={Boolean(
                  formik.touched.hostname && formik.errors.hostname
                )}
                sx={{ width: "180px" }}
                // helperText={touched.ipAddress && errors.ipAddress}
                label="Hostname"
                name="hostname"
                disabled={overlayActive || readOnlyBoot}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.hostname}
                variant="outlined"
              />
            </Grid>
            <Grid margin={1}>
              <Button
                type="submit"
                startIcon={
                  formik.isSubmitting ? <CircularProgress size="1rem" /> : null
                }
                disabled={
                  overlayActive ||
                  readOnlyBoot ||
                  formik.isSubmitting ||
                  !formik.isValid
                }
                variant="contained"
              >
                Apply
              </Button>
            </Grid>
          </form>
        </Grid>
      </Stack>
      <Dialog fullWidth maxWidth="sm" open={openDialog}>
        <DialogContent sx={{ p: 2 }}>
          You will need to reboot for changes to take effect
        </DialogContent>
        <DialogActions sx={{ p: 2 }} disableSpacing={true}>
          <Button onClick={() => setOpenDialog(false)}>Ok</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Hostname;
