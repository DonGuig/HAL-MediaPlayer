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
import axios from "axios";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import _ from "lodash";

import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";
import Emitter from "src/utils/EventEmitter";


type HostnameConfig = {
  hostname: string;
};


const Hostname: React.FC = () => {
  const [openDialog, setOpenDialog] = useState<boolean>(false);

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
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
        setStatus({ success: false });
        setSubmitting(false);
      }
    },
  });

  const getHostname = useCallback(() => {
    axiosServerAPI
      .get<HostnameConfig>("/getHostname")
      .then((res) => {
        formik.setFieldValue("hostname", res.data.hostname);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  }, [formik]);

  async function setHostname(hn: HostnameConfig) {
    axiosServerAPI
      .post<HostnameConfig>("/setHostname", hn)
      .then((res) => {
        getHostname();
        Emitter.emit("hostnameChanged", []);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
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
            <Grid item margin={1}>
              <TextField
                error={Boolean(
                  formik.touched.hostname && formik.errors.hostname
                )}
                sx={{ width: "180px" }}
                // helperText={touched.ipAddress && errors.ipAddress}
                label="Hostname"
                name="hostname"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.hostname}
                variant="outlined"
              />
            </Grid>
            <Grid item margin={1}>
              <Button
                type="submit"
                startIcon={
                  formik.isSubmitting ? <CircularProgress size="1rem" /> : null
                }
                disabled={formik.isSubmitting || !formik.isValid}
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
