import _ from "lodash";

import { useState, createContext, useEffect } from "react";
import HttpApiRequests from "src/utils/HttpRequests";

type OverlayContextType = { overlayActive: boolean };

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const OverlayContext = createContext<OverlayContextType>(
  {} as OverlayContextType
);

export const OverlayContextProvider = ({ children }) => {
  const [overlayActive, setOverlayActive] = useState<boolean>(false);

  const getOverlayInfo = () => {
    HttpApiRequests.get<OverlayContextType>("/getOverlayInfo")
      .then((res) => {
        setOverlayActive(res.overlayActive);
      })
      .catch();
  };

  useEffect(() => {
    getOverlayInfo();
  }, []);

  return (
    <OverlayContext.Provider value={{ overlayActive }}>
      {children}
    </OverlayContext.Provider>
  );
};
