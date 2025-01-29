import {
  Grid,
  Typography,
  Stack,
  Button,
} from "@mui/material";
import axios from "axios";
import * as React from "react";
import globalSnackbar from "src/utils/snackbarUtils";
import _ from "lodash";
import axiosServerAPI from "src/utils/axios";

const HDMIOnOff: React.FC = () => {
  const sendHDMIOnOrOffMessage = (hmdiOn: boolean) => {
    let url: string = "";
    if (hmdiOn) {
      url = "/hdmi_on";
    } else {
      url = "/hdmi_off";
    }
    axiosServerAPI
      .post(url)
      .then(() => {
        globalSnackbar.success("Successfully changed HDMI state");
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });
  };

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
          HDMI Output State
        </Typography>
        <Typography variant="body2">
          These commands allow to turn the HDMI signal on or off.
        </Typography>
        <Typography variant="body2" marginBottom={2}>
          This can be useful to turn on or off connected screens if they are set
          up to turn on/off with hdmi input signal.
        </Typography>
        <Stack
          direction="column"
          spacing={2}
          alignItems="center"
          justifyContent="center"
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={2}
          >
            <Button
              variant="contained"
              onClick={() => sendHDMIOnOrOffMessage(true)}
            >
              HDMI Signal On
            </Button>
            <Button
              variant="contained"
              onClick={() => sendHDMIOnOrOffMessage(false)}
            >
              HDMI Signal Off
            </Button>
          </Stack>
        </Stack>
      </Grid>
    </>
  );
};

export default HDMIOnOff;
