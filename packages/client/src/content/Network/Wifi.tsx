import * as Yup from "yup";
import { useFormik } from "formik";
import {
  Button,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import axios from "axios";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import _ from "lodash";

import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";
import ipRegex from "ip-regex";

type WifiConfig = {
  SSID: string;
  pass: String;
  active: "true" | "false";
};

const Wifi: React.FC = () => {
  const [ isActiveWifi, setIsActiveWifi] = useState<"true" | "false">("true");

  const formik = useFormik<WifiConfig>({
    initialValues: {
      SSID: "",
      pass: "",
      active:"true"
    },
    validationSchema: Yup.object().shape({
      SSID: Yup.string(),
      pass: Yup.string(),
      active: Yup.string()
    }),
    onSubmit: async (
      values,
      { resetForm, setErrors, setStatus, setSubmitting }
    ) => {
      try {
        let toSend = {
          SSID: formik.values.SSID,
          pass: formik.values.pass,
          active: formik.values.active
        };
        await setWifiConfig(toSend);
        setStatus({ success: true });
        setSubmitting(false);
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

  const getWifiConfig = useCallback(() => {
    axiosServerAPI
      .get<WifiConfig>("/getWifiConfig")
      .then((res) => {
        formik.setFieldValue("SSID", res.data.SSID);
        formik.setFieldValue("pass", res.data.pass);
        formik.setFieldValue("active", res.data.active);
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

  async function setWifiConfig(conf: WifiConfig) {
    axiosServerAPI
      .post<WifiConfig>("/setWifiConfig", conf)
      .then((res) => {
        getWifiConfig();
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

  const handleActiveWifiChange = (
    event: React.MouseEvent<HTMLElement>,
    act: string
  ) => {
    if (act !== null) {
      formik.setFieldValue("active", act);
    }
  };

  useEffect(() => {
    getWifiConfig();
  }, []);

  return (
    <Stack marginY={4} direction="column" width="100%">
      <Typography variant="h4" align="center">
        Wifi
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
            <ToggleButtonGroup
              value={formik.values.active}
              exclusive
              onChange={handleActiveWifiChange}
            >
              <ToggleButton value="true">Active</ToggleButton>
              <ToggleButton value="false">Off</ToggleButton>
            </ToggleButtonGroup>{" "}
          </Grid>
          <Grid item margin={1}>
            <TextField
              error={Boolean(
                formik.touched.SSID && formik.errors.SSID
              )}
              sx={{ width: "180px" }}
              // helperText={touched.ipAddress && errors.ipAddress}
              label="SSID"
              name="SSID"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.SSID}
              disabled={formik.values.active === "false"}
              variant="outlined"
            />
          </Grid>
          <Grid item margin={1}>
            <TextField
              error={Boolean(formik.touched.pass && formik.errors.pass)}
              fullWidth
              // helperText={touched.ipAddress && errors.ipAddress}
              label="Password"
              name="pass"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.pass}
              disabled={formik.values.active === "false"}
              variant="outlined"
            />
          </Grid>
          <Grid item margin={1}>
            <Button
              type="submit"
              startIcon={
                formik.isSubmitting ? <CircularProgress size="1rem" /> : null
              }
              // disabled={formik.isSubmitting || !formik.isValid}
              disabled={true}
              variant="contained"
            >
              Apply
            </Button>
          </Grid>
        </form>
      </Grid>
    </Stack>
  );
};

export default Wifi;
