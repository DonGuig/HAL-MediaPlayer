import * as Yup from "yup";
import { useFormik } from "formik";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
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
import { useCallback, useContext, useEffect, useState } from "react";
import _ from "lodash";

import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";
import { OverlayContext } from "src/contexts/OverlayContext";

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
        Are you sure you want to forget all known wifis ? Wifi will be turned
        off.
      </DialogContent>
      <DialogActions sx={{ p: 2 }} disableSpacing={true}>
        <Button onClick={confirmCallback}>Ok</Button>
        <Button onClick={cancelCallback}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

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
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);
  const [openForgetDialog, setOpenForgetDialog] = useState<boolean>(false);

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
          const toDisplay = err.response?.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          } else {
            globalSnackbar.error("An error occurred while setting wifi.");
          }
        } else {
          globalSnackbar.error("An unknown error occurred.");
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
          const toDisplay = err.response?.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          } else {
            globalSnackbar.error("An error occurred while setting wifi.");
          }
        } else {
          globalSnackbar.error("An unknown error occurred.");
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
          const toDisplay = err.response?.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          } else {
            globalSnackbar.error(
              "An error occurred while fetching wifi active status."
            );
          }
        } else {
          globalSnackbar.error("An unknown error occurred.");
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
          const toDisplay = err.response?.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          } else {
            globalSnackbar.error(
              "An error occurred while setting wifi active status."
            );
          }
        } else {
          globalSnackbar.error("An unknown error occurred.");
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
          const toDisplay = err.response?.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          } else {
            globalSnackbar.error(
              "An error occurred while fetching current wifi."
            );
          }
        } else {
          globalSnackbar.error("An unknown error occurred.");
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

  const sendWifiForget = () => {
    axiosServerAPI
      .post(`/forgetKnownWifis`)
      .then(() => {
        setTimeout(getIsActiveWifi, 1000);
        setTimeout(getCurrentWifi, 1000);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response?.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          } else {
            globalSnackbar.error(
              "An error occurred while sending wifi forget command."
            );
          }
        } else {
          globalSnackbar.error("An unknown error occurred.");
        }
      });
  };

  useEffect(() => {
    getIsActiveWifi();
    getCurrentWifi();
  }, []);

  const confirmForgetCB = useCallback(() => {
    sendWifiForget();
    setOpenForgetDialog(false);
  }, []);

  return (
    <Stack marginY={4} spacing={2} direction="column" width="100%">
      <Typography variant="h4" align="center">
        Wifi
      </Typography>
      <Grid margin={1} alignSelf="center">
        <ToggleButtonGroup
          value={wifiActivated}
          exclusive
          disabled={overlayActive || readOnlyBoot}
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
        <Button
          disabled={overlayActive || readOnlyBoot}
          variant="outlined"
          size="small"
          onClick={() => setOpenForgetDialog(true)}
        >
          Forget known wifis
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
          <Grid margin={1}>
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
              disabled={
                overlayActive || readOnlyBoot || wifiActivated === "false"
              }
              variant="outlined"
            />
          </Grid>
          <Grid margin={1}>
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
              disabled={
                overlayActive || readOnlyBoot || wifiActivated === "false"
              }
              variant="outlined"
            />
          </Grid>
          <Grid margin={1}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    name="hidden"
                    disabled={overlayActive || readOnlyBoot}
                    checked={formik.values.hidden}
                    onChange={formik.handleChange}
                  />
                }
                label="Hidden"
              />
            </FormGroup>
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
      <ConfirmDialog
        open={openForgetDialog}
        confirmCallback={confirmForgetCB}
        cancelCallback={() => {
          setOpenForgetDialog(false);
        }}
      />
    </Stack>
  );
};

export default Wifi;
