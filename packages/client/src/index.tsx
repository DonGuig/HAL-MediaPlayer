import App from "./App";
import ReactDOM from "react-dom";
import { createRoot } from 'react-dom/client';
import * as serviceWorker from "./serviceWorker";
// import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";

import "nprogress/nprogress.css";
import { SidebarProvider } from "./contexts/SidebarContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";

const container = document.getElementById('root');

const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(// <HelmetProvider>
  <SidebarProvider>
    {/* <WebSocketProvider> */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* </WebSocketProvider> */}
  </SidebarProvider>,
  // </HelmetProvider>,);
)

serviceWorker.unregister();
