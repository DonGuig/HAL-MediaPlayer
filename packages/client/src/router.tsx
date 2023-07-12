import { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import { RouteObject } from "react-router";

import AccentSidebarLayout from "src/layouts/AccentSidebarLayout";

import SuspenseLoader from "src/components/SuspenseLoader";

const Loader = (Component) => (props) =>
(
  <Suspense fallback={<SuspenseLoader />}>
    <Component {...props} />
  </Suspense>
);

// Management
const Playback = Loader(
  lazy(() => import("src/content/Playback"))
);
const Network = Loader(
  lazy(() => import("src/content/Network"))
);
const Setup = Loader(
  lazy(() => import("src/content/Setup"))
);
const System = Loader(
  lazy(() => import("src/content/System"))
);
const About = Loader(
  lazy(() => import("src/content/About"))
);

// Status

const Status404 = Loader(
  lazy(() => import("src/content/Status/Status404"))
);

const routes: RouteObject[] = [
  {
    path: "/",
    element: (

          <AccentSidebarLayout />

    ),
    children: [
      {
        path: "playback",
        element: <Playback />,
      },
      {
        path: "",
        element: <Navigate to="/playback" replace />,
      },
      {
        path: "setup",
        element: <Setup />,
      },
      {
        path: "system",
        element: <System />,
      },
      {
        path: "network",
        element: <Network />,
      },
      {
        path: "about",
        element: <About />,
      },
    ]
  },
  {
    path: "*",
    element: (
          <AccentSidebarLayout />
    ),
    children: [
      {
        path: "*",
        element: <Status404 />,
      },
    ],
  },
];

export default routes;
