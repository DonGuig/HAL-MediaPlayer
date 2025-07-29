import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import _ from "lodash";

import globalSnackbar from "src/utils/snackbarUtils";
import Emitter from "src/utils/EventEmitter";
import HttpApiRequests from "src/utils/HttpRequests";

type HostnameConfig = {
  hostname: string;
};

const Name: React.FC = () => {
  const [hostname, setHostname] = useState<string>("None");

  const getHostname = () => {
    HttpApiRequests.get<HostnameConfig>("/getHostname")
      .then((res) => {
        setHostname(res.hostname);
      })
      .catch();
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
