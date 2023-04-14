import axios from "axios";
import _ from "lodash";
import { useState, createContext, useEffect } from "react";
import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";

type PlaybackContext = {
  stopped: boolean;
  transportCommandAndUpdateStatus: (url: string) => void;
  updateStatus : () => void;
};

type TransportStatusResponse = { stopped: boolean };

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const PlaybackContext = createContext<PlaybackContext>({
  stopped: false,
} as PlaybackContext);

export const PlaybackContextProvider = ({ children }) => {
  const [stopped, setStopped] = useState<boolean>(false);

  const updateStatus = () => {
    axiosServerAPI
      .get<TransportStatusResponse>(`/getTransportStatus`)
      .then((res) => setStopped(res.data.stopped))
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          }
        }
      });

  };

  const transportCommandAndUpdateStatus = (url: string) => {
    axiosServerAPI
      .post(url)
      .then(() => updateStatus())
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
    updateStatus()
  }, [])

  return (
    <PlaybackContext.Provider
      value={{
        stopped,
        transportCommandAndUpdateStatus,
        updateStatus
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};
