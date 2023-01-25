import * as Yup from "yup";
import { Formik } from "formik";
import {
  Button,
  CircularProgress,
  Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import axios from "axios";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import _, { get } from "lodash";

import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";
import ipRegex from "ip-regex";

type DHCPorFixed = "DHCP" | "Fixed IP";

type WiredNetworkConfig = {
  DHCPorFixed: DHCPorFixed;
  ipAddress: String;
};

const WiredEthernet: React.FC = () => {
  const [ipAddress, setIpAddress] = useState<String>("0.0.0.0");
  const [DHCPorFixed, setDHCPorFixed] = useState<DHCPorFixed>("DHCP");

  async function getWiredNetworkConfig(): Promise<WiredNetworkConfig> {
    await axiosServerAPI
      .get<WiredNetworkConfig>("/getWiredNetwokConfig")
      .then((res) => {
        setDHCPorFixed(res.data.DHCPorFixed);
        setIpAddress(res.data.ipAddress);
        return res.data;
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
    return { DHCPorFixed: "DHCP", ipAddress: "0.0.0.0" };
  }

  async function setWiredNetworkSetting(conf: WiredNetworkConfig) {
    axiosServerAPI
      .post<WiredNetworkConfig>("/setWiredNetwokConfig", conf)
      .then((res) => {
        getWiredNetworkConfig();
      })
      .catch((err) => {});
  }

  const handleDHCPorFixedChange = (
    event: React.MouseEvent<HTMLElement>,
    type: DHCPorFixed
  ) => {
    if (type !== null) {
      setDHCPorFixed(type);
    }
  };

  let initFormValues = useRef<WiredNetworkConfig>({ DHCPorFixed: "DHCP", ipAddress: "0.0.0.0" });

  useEffect(() => {
    getWiredNetworkConfig().then((res) => initFormValues.current = res)
  }, [])

  return (
    <Grid container marginY={2} justifyContent="center">
      <Typography variant="h4">Wired Ethernet</Typography>
      <Formik
        initialValues={initFormValues.current}
        validationSchema={Yup.object().shape({
          ipAddress: Yup.string()
            .required("L'adresse IP est nécessaire")
            .matches(ipRegex.v4({ exact: true, includeBoundaries: true }), {
              message: "Format d'adresse incorrect",
              excludeEmptyString: true,
            }),
        })}
        onSubmit={async (
          values,
          { resetForm, setErrors, setStatus, setSubmitting }
        ) => {
          try {
            let toSend = {
              DHCPorFixed: DHCPorFixed,
              ipAddress: ipAddress,
            };
            await setWiredNetworkSetting(toSend);
            await getWiredNetworkConfig();
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
        }}
      >
        {({
          errors,
          handleBlur,
          handleChange,
          handleSubmit,
          isSubmitting,
          touched,
          values,
        }) => (
          <form onSubmit={handleSubmit}>
            <Grid container direction="column" spacing={3}>
              <Grid item>
                <Typography variant="subtitle2">Appartenance :</Typography>
              </Grid>
              <Grid item>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item>
                    <ToggleButtonGroup
                      value={values.DHCPorFixed}
                      exclusive
                      onChange={() => {Formik.setFieldValue}}
                    >
                      <ToggleButton value="DHCP">DHCP</ToggleButton>
                      <ToggleButton value="Fixed IP">Fixed IP</ToggleButton>
                    </ToggleButtonGroup>{" "}
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      error={Boolean(touched.ipAddress && errors.ipAddress)}
                      fullWidth
                      // helperText={touched.ipAddress && errors.ipAddress}
                      label="Adresse IP"
                      name="ipAddress"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.ipAddress}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Button
              type="submit"
              startIcon={isSubmitting ? <CircularProgress size="1rem" /> : null}
              disabled={isSubmitting}
              variant="contained"
            >
              Ajouter
            </Button>
          </form>
        )}
      </Formik>
      <Grid
        container
        margin={1}
        spacing={2}
        direction="row"
        justifyContent="center"
      >
        <Grid item></Grid>
      </Grid>
    </Grid>
  );
};

export default WiredEthernet;
