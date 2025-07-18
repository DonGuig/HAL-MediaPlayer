import axios from "axios";
import _ from "lodash";

import { useState, createContext, useEffect } from "react";
import axiosServerAPI from "src/utils/axios";
import globalSnackbar from "src/utils/snackbarUtils";
type OverlayContext = { overlayActive: boolean; readOnlyBoot: boolean };

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const OverlayContext = createContext<OverlayContext>(
  {} as OverlayContext
);

export const OverlayContextProvider = ({ children }) => {
  const [overlayActive, setOverlayActive] = useState<boolean>(false);
  const [readOnlyBoot, setReadOnlyBoot] = useState<boolean>(false);

  const getOverlayInfo = () => {
    axiosServerAPI
      .get<OverlayContext>("/getOverlayInfo")
      .then((res) => {
        setOverlayActive(res.data.overlayActive);
        setReadOnlyBoot(res.data.readOnlyBoot);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          const toDisplay = err.response?.data;
          if (_.isString(toDisplay)) {
            globalSnackbar.error(toDisplay);
          } else {
            globalSnackbar.error("An error occurred while fetching file system overlay status.");
          }
        } else {
          globalSnackbar.error("An unknown error occurred.");
        }
      });
  };

  useEffect(() => {
    getOverlayInfo();
  }, []);

  return (
    <OverlayContext.Provider value={{ overlayActive, readOnlyBoot }}>
      {children}
    </OverlayContext.Provider>
  );
};
