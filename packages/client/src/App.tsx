import { useRoutes } from "react-router-dom";
import routes from "./router";
import { SnackbarProvider } from "notistack";
import useScrollTop from "src/hooks/useScrollTop";

import ThemeProvider from "./theme/ThemeProvider";
import {
  Backdrop,
  Box,
  CircularProgress,
  CssBaseline,
  Typography,
} from "@mui/material";

import { SnackbarUtilsConfigurator } from "./utils/snackbarUtils";
import { OverlayContextProvider } from "./contexts/OverlayContext";
import { useEffect, useState } from "react";
import HttpApiRequests from "./utils/HttpRequests";

const App = () => {
  const [isConnected, setIsConnected] = useState(true);
  const content = useRoutes(routes);
  useScrollTop();

  useEffect(() => {
    const intervalId = setInterval(() => {
      HttpApiRequests.post("/ping", { silent: true })
        .then((res) => {
          setIsConnected(true);
        })
        .catch(() => {
          setIsConnected(false);
        });
    }, 3000);

    // Run once immediately on mount
    HttpApiRequests.post("/ping", { silent: true })
      .then((res) => {
        setIsConnected(true);
      })
      .catch(() => {
        setIsConnected(false);
      });

    return () => clearInterval(intervalId);
  }, []);

  return (
    <ThemeProvider>
      <SnackbarProvider
        maxSnack={6}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <OverlayContextProvider>
          <SnackbarUtilsConfigurator />

          <CssBaseline />
          <Backdrop
            open={!isConnected}
            sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          >
            <Box display="flex" flexDirection="column" alignItems="center">
              <CircularProgress color="inherit" />
              <Typography variant="h2" color="#fff" mt={2}>
                Reconnecting to server...
              </Typography>
            </Box>
          </Backdrop>
          {content}
        </OverlayContextProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
