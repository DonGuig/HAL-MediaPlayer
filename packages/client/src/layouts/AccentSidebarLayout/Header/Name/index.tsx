import { Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import _ from "lodash";

import globalSnackbar from "src/utils/snackbarUtils";
import Emitter from "src/utils/EventEmitter";
import axiosServerAPI from "src/utils/axios";

type HostnameConfig = {
  hostname: string;
};

const Name: React.FC = () => {
  const [hostname, setHostname] = useState<string>("None");

  const getHostname = () => {
    axiosServerAPI
      .get<HostnameConfig>("/getHostname")
      .then((res) => {
        setHostname(res.data.hostname);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response?.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          } else {
            globalSnackbar.error("An error occurred while fetching hostname.");
          }
        } else {
          globalSnackbar.error("An unknown error occurred.");
        }
      });
  };

  useEffect(() => {
    getHostname();
    Emitter.on("hostnameChanged", getHostname);

    return () => {
      Emitter.off("deviceNameChanged", getHostname);
    };
  }, []);

  return <Typography variant="h4">{hostname}</Typography>;
};

export default Name;
