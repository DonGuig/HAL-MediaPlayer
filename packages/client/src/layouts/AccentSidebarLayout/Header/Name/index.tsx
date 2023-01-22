import { Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import _ from "lodash";

import globalSnackbar from "src/utils/snackbarUtils";
import Emitter from "src/utils/EventEmitter";
import axiosServerAPI from "src/utils/axios";

type deviceNameResponse = {
  deviceName: string;
};

const Name: React.FC = () => {
  const [deviceName, setDeviceName] = useState<string>("None");

  const getDeviceName = () => {
    axiosServerAPI
      .get<deviceNameResponse>(
        `/getDeviceName`
      )
      .then((res) => {
        setDeviceName(res.data.deviceName);
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

  useEffect(() => {
    getDeviceName();
    Emitter.on("deviceNameChanged", getDeviceName);

    return () => {
      Emitter.off("deviceNameChanged", getDeviceName);
    };
  }, []);

  return <Typography variant="h4">{deviceName}</Typography>;
};

export default Name;
