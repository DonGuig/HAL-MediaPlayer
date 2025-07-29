import _ from "lodash";
import { useState, createContext, useEffect } from "react";
import HttpApiRequests from "src/utils/HttpRequests";

type PlaybackContext = {
  stopped: boolean;
  transportCommandAndUpdateStatus: (url: string) => void;
  updateStatus: () => void;
};

type TransportStatusResponse = { stopped: boolean };

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const PlaybackContext = createContext<PlaybackContext>({
  stopped: false,
} as PlaybackContext);

export const PlaybackContextProvider = ({ children }) => {
  const [stopped, setStopped] = useState<boolean>(false);

  const updateStatus = () => {
    HttpApiRequests
      .get<TransportStatusResponse>(`/getTransportStatus`)
      .then((res) => setStopped(res.stopped))
      .catch();
  };

  const transportCommandAndUpdateStatus = (url: string) => {
    HttpApiRequests
      .post(url)
      .then(() => updateStatus())
      .catch();
  };

  useEffect(() => {
    updateStatus();
  }, []);

  return (
    <PlaybackContext.Provider
      value={{
        stopped,
        transportCommandAndUpdateStatus,
        updateStatus,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};
