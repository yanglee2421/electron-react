import { Navigate, type RouteObject } from "react-router";
import { RootHydrateFallback } from "./root";

export const createRoutes = (): RouteObject[] => {
  return [
    {
      children: [
        {
          index: true,
          element: <Navigate to={{ pathname: "/scanner" }} />,
        },
        {
          path: "scanner",
          lazy: () => import("#renderer/pages/scanner/component"),
        },
        {
          path: "canvas",
          lazy: () => import("#renderer/pages/canvas/component"),
        },
      ],
      HydrateFallback: RootHydrateFallback,
    },
  ];
};
