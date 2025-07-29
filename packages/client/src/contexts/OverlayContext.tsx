import _ from "lodash";

import { useState, createContext, useEffect } from "react";
import HttpApiRequests from "src/utils/HttpRequests";

type OverlayContext = { overlayActive: boolean; readOnlyBoot: boolean };

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const OverlayContext = createContext<OverlayContext>(
  {} as OverlayContext
);

export const OverlayContextProvider = ({ children }) => {
  const [overlayActive, setOverlayActive] = useState<boolean>(false);
  const [readOnlyBoot, setReadOnlyBoot] = useState<boolean>(false);

  const getOverlayInfo = () => {
    HttpApiRequests.get<OverlayContext>("/getOverlayInfo")
      .then((res) => {
        setOverlayActive(res.overlayActive);
        setReadOnlyBoot(res.readOnlyBoot);
      })
      .catch();
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
