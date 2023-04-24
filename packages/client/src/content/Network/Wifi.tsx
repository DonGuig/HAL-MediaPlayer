import * as Yup from "yup";
import { useFormik } from "formik";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Grid,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import { green, grey } from "@mui/material/colors";
import axios from "axios";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import _ from "lodash";

import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";

type WifiConfig = {
  SSID: string;
  pass: String;
  hidden: boolean;
};

type CurrentWifi = {
  SSID: string;
};

type WifiActive = {
  active: "true" | "false";
};

const Wifi: React.FC = () => {
  const [wifiActivated, setWifiActivated] = useState<"true" | "false">("true");
  const [currentWifi, setCurrentWifi] = useState<String>("None");

  const formik = useFormik<WifiConfig>({
    initialValues: {
      SSID: "",
      pass: "",
      hidden: false,
    },
    validationSchema: Yup.object().shape({
      SSID: Yup.string().required().max(32),
      pass: Yup.string().required().min(8).max(64),
    }),
    onSubmit: async (
      values,
      { resetForm, setErrors, setStatus, setSubmitting }
    ) => {
      try {
        let toSend = {
          SSID: formik.values.SSID,
          pass: formik.values.pass,
          hidden: formik.values.hidden,
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

  async function setWifiConfig(conf: WifiConfig) {
    axiosServerAPI
      .post<WifiConfig>("/setWifiConfig", conf)
      .then((res) => {
        getCurrentWifi();
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

  const getIsActiveWifi = useCallback(() => {
    axiosServerAPI
      .get<WifiActive>("/getIsWifiActive")
      .then((res) => {
        setWifiActivated(res.data.active ? "true" : "false");
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  }, []);

  async function setIsActiveWifi(active: boolean) {
    axiosServerAPI
      .post<WifiActive>(
        "/setIsWifiActive",
        active ? { active: "true" } : { active: "false" }
      )
      .then((res) => {
        setTimeout(getIsActiveWifi, 3000);
        setTimeout(getCurrentWifi, 3000);
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

  const getCurrentWifi = useCallback(() => {
    axiosServerAPI
      .get<CurrentWifi>("/getCurrentWifi")
      .then((res) => {
        if (res.data.SSID) {
          setCurrentWifi(res.data.SSID);
        } else {
          setCurrentWifi("None");
        }
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  }, []);

  const handleActiveWifiChange = (
    event: React.MouseEvent<HTMLElement>,
    act: string
  ) => {
    if (act !== null) {
      if (act === "true") {
        setIsActiveWifi(true);
      } else {
        setIsActiveWifi(false);
      }
    }
  };

  useEffect(() => {
    getIsActiveWifi();
    getCurrentWifi();
  }, []);

  return (
    <Stack marginY={4} spacing={2} direction="column" width="100%">
      <Typography variant="h4" align="center">
        Wifi
      </Typography>
      <Grid item margin={1} alignSelf="center">
        <ToggleButtonGroup
          value={wifiActivated}
          exclusive
          onChange={handleActiveWifiChange}
        >
          <ToggleButton value="true">Active</ToggleButton>
          <ToggleButton value="false">Off</ToggleButton>
        </ToggleButtonGroup>{" "}
      </Grid>
      <Stack direction="row" alignSelf="center" alignItems="center" spacing={2}>
        Connected Wifi :{" "}
        <CircleIcon
          sx={{ color: currentWifi === "None" ? grey[500] : green[500] }}
        />{" "}
        {currentWifi}{" "}
        <Button variant="contained" onClick={() => getCurrentWifi()}>
          Refresh
        </Button>
      </Stack>
      <Grid
        container
        margin={2}
        spacing={3}
        direction="row"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        {" "}
        <Typography>Connect to wifi :</Typography>
        <form
          onSubmit={formik.handleSubmit}
          style={{ display: "flex", alignItems: "center" }}
        >
          <Grid item margin={1}>
            <TextField
              error={
                wifiActivated === "false"
                  ? Boolean(formik.touched.SSID && formik.errors.SSID)
                  : Boolean(formik.errors.SSID)
              }
              sx={{ width: "180px" }}
              // helperText={touched.ipAddress && errors.ipAddress}
              label="SSID"
              name="SSID"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.SSID}
              disabled={wifiActivated === "false"}
              variant="outlined"
            />
          </Grid>
          <Grid item margin={1}>
            <TextField
              error={
                wifiActivated === "false"
                  ? Boolean(formik.touched.pass && formik.errors.pass)
                  : Boolean(formik.errors.pass)
              }
              fullWidth
              // helperText={touched.ipAddress && errors.ipAddress}
              label="Password"
              name="pass"
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.pass}
              disabled={wifiActivated === "false"}
              variant="outlined"
            />
          </Grid>
          <Grid item margin={1}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    name="hidden"
                    checked={formik.values.hidden}
                    onChange={formik.handleChange}
                  />
                }
                label="Hidden"
              />
            </FormGroup>
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
  );
};

export default Wifi;
