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
import CircleIcon from "@mui/icons-material/Circle";
import { green, grey } from "@mui/material/colors";

import * as React from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import _ from "lodash";

import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";
import ipRegex from "ip-regex";
import { OverlayContext } from "src/contexts/OverlayContext";

type DHCPorFixed = "DHCP" | "Fixed IP";

type WiredNetworkConfig = {
  DHCPorFixed: DHCPorFixed;
  ipAddress: String;
  netmask: String;
  connected?: boolean;
};

const WiredEthernet: React.FC = () => {
  const [cableConnected, setCableConnected] = useState<boolean>(false);
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);

  const formik = useFormik<WiredNetworkConfig>({
    initialValues: {
      DHCPorFixed: "DHCP",
      ipAddress: "0.0.0.0",
      netmask: "255.255.255.0",
    },
    validationSchema: Yup.object().shape({
      ipAddress: Yup.string().when("DHCPorFixed", {
        is: "Fixed IP",
        then: Yup.string()
          .required("IP Address is required")
          .matches(ipRegex.v4({ exact: true, includeBoundaries: true }), {
            message: "Incorrect address format",
            excludeEmptyString: true,
          }),
      }),
      netmask: Yup.string().when("DHCPorFixed", {
        is: "Fixed IP",
        then: Yup.string()
          .required("Netmask is required")
          .matches(ipRegex.v4({ exact: true, includeBoundaries: true }), {
            message: "Incorrect address format",
            excludeEmptyString: true,
          }),
      }),
    }),
    onSubmit: async (
      values,
      { resetForm, setErrors, setStatus, setSubmitting }
    ) => {
      try {
        let toSend = {
          DHCPorFixed: formik.values.DHCPorFixed,
          ipAddress: formik.values.ipAddress,
          netmask: formik.values.netmask,
        };
        await setWiredNetworkSetting(toSend);
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

  const getWiredNetworkConfig = useCallback(() => {
    axiosServerAPI
      .get<WiredNetworkConfig>("/getWiredNetwokConfig")
      .then((res) => {
        formik.setFieldValue("DHCPorFixed", res.data.DHCPorFixed);
        formik.setFieldValue("ipAddress", res.data.ipAddress);
        formik.setFieldValue("netmask", res.data.netmask);
        setCableConnected(res.data.connected);
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

  async function setWiredNetworkSetting(conf: WiredNetworkConfig) {
    axiosServerAPI
      .post<WiredNetworkConfig>("/setWiredNetwokConfig", conf)
      .then((res) => {
        setTimeout(getWiredNetworkConfig, 1000);
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

  const handleDHCPorFixedChange = (
    event: React.MouseEvent<HTMLElement>,
    type: DHCPorFixed
  ) => {
    if (type !== null) {
      formik.setFieldValue("DHCPorFixed", type);
    }
  };

  useEffect(() => {
    getWiredNetworkConfig();
  }, []);

  return (
    <Stack marginY={4} direction="column" width="100%" spacing={2}>
      <Typography variant="h4" align="center">
        Wired Ethernet
      </Typography>
      <Stack direction="row" alignSelf="center" alignItems="center" spacing={2}>
        Connected :{" "}
        <CircleIcon sx={{ color: cableConnected ? green[500] : grey[500] }} />{" "}
        <Button variant="contained" onClick={() => getWiredNetworkConfig()}>
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
        <form
          onSubmit={formik.handleSubmit}
          style={{ display: "flex", alignItems: "center" }}
        >
          <Grid item margin={1}>
            <ToggleButtonGroup
              value={formik.values.DHCPorFixed}
              exclusive
              disabled={overlayActive || readOnlyBoot}
              onChange={handleDHCPorFixedChange}
            >
              <ToggleButton value="DHCP">DHCP</ToggleButton>
              <ToggleButton value="Fixed IP">Fixed IP</ToggleButton>
            </ToggleButtonGroup>{" "}
          </Grid>
          <Grid item margin={1}>
            <TextField
              error={Boolean(
                formik.touched.ipAddress && formik.errors.ipAddress
              )}
              sx={{ width: "180px" }}
              // helperText={touched.ipAddress && errors.ipAddress}
              label="IP address"
              name="ipAddress"
              disabled={overlayActive || readOnlyBoot}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.ipAddress}
              // disabled={formik.values.DHCPorFixed === "DHCP"}
              variant="outlined"
            />
          </Grid>
          <Grid item margin={1}>
            <TextField
              error={Boolean(formik.touched.netmask && formik.errors.netmask)}
              fullWidth
              // helperText={touched.ipAddress && errors.ipAddress}
              label="Netmask"
              name="netmask"
              disabled={overlayActive || readOnlyBoot}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.netmask}
              // disabled={formik.values.DHCPorFixed === "DHCP"}
              variant="outlined"
            />
          </Grid>
          <Grid item margin={1}>
            <Button
              type="submit"
              disabled={overlayActive || readOnlyBoot}
              startIcon={
                formik.isSubmitting ? <CircularProgress size="1rem" /> : null
              }
              // disabled={formik.isSubmitting || !formik.isValid}
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

export default WiredEthernet;
