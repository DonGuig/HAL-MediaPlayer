import * as Yup from "yup";
import { useFormik } from "formik";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Link,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import { green, grey } from "@mui/material/colors";

import * as React from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import _ from "lodash";

import ipRegex from "ip-regex";
import { OverlayContext } from "src/contexts/OverlayContext";
import HttpApiRequests, { isConnectionError } from "src/utils/HttpRequests";
import globalSnackbar from "src/utils/snackbarUtils";
import { SERVER_URL } from "src/ServerURL";

type DHCPorFixed = "DHCP" | "Fixed IP";

type WiredNetworkConfig = {
  DHCPorFixed: DHCPorFixed;
  ipAddress: String;
  netmask: String;
  connected?: boolean;
};

type AppliedWiredConfig = {
  DHCPorFixed: DHCPorFixed;
  ipAddress: String;
};

// Set when a change moves the player away from the address this page talks to.
type MovedTo = { ipAddress: String } | { dhcp: true };

const pageUrlAt = (ipAddress: String) => {
  const port = window.location.port;
  return `http://${ipAddress}${port ? `:${port}` : ""}`;
};

const WiredEthernet: React.FC = () => {
  const [cableConnected, setCableConnected] = useState<boolean>(false);
  const [applied, setApplied] = useState<AppliedWiredConfig | null>(null);
  const [movedTo, setMovedTo] = useState<MovedTo | null>(null);
  const { overlayActive } = useContext(OverlayContext);

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
        setStatus({ success: false });
        setSubmitting(false);
      }
    },
  });

  const getWiredNetworkConfig = useCallback((silent: boolean = false) => {
    HttpApiRequests
      .get<WiredNetworkConfig>("/getWiredNetwokConfig", { silent })
      .then((res) => {
        setApplied({ DHCPorFixed: res.DHCPorFixed, ipAddress: res.ipAddress });
        formik.setFieldValue("DHCPorFixed", res.DHCPorFixed);
        formik.setFieldValue("ipAddress", res.ipAddress);
        formik.setFieldValue("netmask", res.netmask);
        setCableConnected(res.connected);
      })
      .catch(() => {});
  }, [formik]);

  async function setWiredNetworkSetting(conf: WiredNetworkConfig) {
    // The new address may not answer from here, so the page can't check on it afterwards.
    // Only known when the page uses the wired IP: through Wifi or a hostname it stays reachable.
    const pageUsesWiredIp =
      applied !== null && SERVER_URL.split(":")[0] === applied.ipAddress;
    const moving =
      pageUsesWiredIp &&
      (conf.DHCPorFixed === "DHCP"
        ? applied.DHCPorFixed !== "DHCP"
        : conf.ipAddress !== applied.ipAddress);

    try {
      await HttpApiRequests.post<WiredNetworkConfig>("/setWiredNetwokConfig", {
        data: conf,
        silent: moving,
      });
    } catch (err) {
      // Losing the connection is expected when moving: the request went through
      if (!moving || !isConnectionError(err)) {
        if (moving) {
          globalSnackbar.error((err as Error).message);
        }
        throw err;
      }
    }

    if (moving) {
      setMovedTo(
        conf.DHCPorFixed === "DHCP"
          ? { dhcp: true }
          : { ipAddress: conf.ipAddress }
      );
    } else {
      // The server doesn't wait for the connection to come up, and DHCP can take a few seconds
      setTimeout(() => getWiredNetworkConfig(true), 1000);
      setTimeout(() => getWiredNetworkConfig(true), 5000);
    }
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
    <>
    <Stack
      direction="column"
      spacing={2}
      sx={{
        marginY: 4,
        width: "100%"
      }}>
      <Typography variant="h4" align="center">
        Wired Ethernet
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignSelf: "center",
          alignItems: "center"
        }}>
        Connected :{" "}
        <CircleIcon sx={{ color: cableConnected ? green[500] : grey[500] }} />{" "}
        <Button variant="contained" onClick={() => getWiredNetworkConfig()}>
          Refresh
        </Button>
      </Stack>
      <Grid
        container
        spacing={3}
        direction="row"
        sx={{
          margin: 2,
          justifyContent: "center",
          alignItems: "center",
          width: "100%"
        }}>
        <form
          onSubmit={formik.handleSubmit}
          style={{ display: "flex", alignItems: "center" }}
        >
          <Grid sx={{
            margin: 1
          }}>
            <ToggleButtonGroup
              value={formik.values.DHCPorFixed}
              exclusive
              disabled={overlayActive}
              onChange={handleDHCPorFixedChange}
            >
              <ToggleButton value="DHCP">DHCP</ToggleButton>
              <ToggleButton value="Fixed IP">Fixed IP</ToggleButton>
            </ToggleButtonGroup>{" "}
          </Grid>
          <Grid sx={{
            margin: 1
          }}>
            <TextField
              error={Boolean(
                formik.touched.ipAddress && formik.errors.ipAddress
              )}
              sx={{ width: "150px" }}
              // helperText={touched.ipAddress && errors.ipAddress}
              label="IP address"
              name="ipAddress"
              disabled={
                overlayActive ||
                formik.values.DHCPorFixed === "DHCP"
              }
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.ipAddress}
              // disabled={formik.values.DHCPorFixed === "DHCP"}
              variant="outlined"
            />
          </Grid>
          <Grid sx={{
            margin: 1
          }}>
            <TextField
              error={Boolean(formik.touched.netmask && formik.errors.netmask)}
              sx={{ width: "150px" }}
              // helperText={touched.ipAddress && errors.ipAddress}
              label="Netmask"
              name="netmask"
              disabled={
                overlayActive ||
                formik.values.DHCPorFixed === "DHCP"
              }
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              value={formik.values.netmask}
              // disabled={formik.values.DHCPorFixed === "DHCP"}
              variant="outlined"
            />
          </Grid>
          <Grid sx={{
            margin: 1
          }}>
            <Button
              type="submit"
              disabled={overlayActive}
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
    <Dialog fullWidth maxWidth="sm" open={movedTo !== null}>
      <DialogContent sx={{ p: 2 }}>
        {movedTo !== null && "ipAddress" in movedTo ? (
          <>
            The player has moved to a new wired address. Continue at{" "}
            <Link href={pageUrlAt(movedTo.ipAddress)}>
              {pageUrlAt(movedTo.ipAddress)}
            </Link>
            . Your computer must be on the same network as this address.
          </>
        ) : (
          <>
            The player now takes its wired address from the DHCP server, so this
            page can no longer reach it at its old address. Look for the new
            address on your DHCP server, or try its hostname followed by .local
            in your browser.
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }} disableSpacing={true}>
        <Button onClick={() => setMovedTo(null)}>Close</Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default WiredEthernet;
