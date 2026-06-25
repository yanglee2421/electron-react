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
          path: "dashboard",
          lazy: () => import("#renderer/pages/dashboard/component"),
        },
        {
          path: "crud-dashboard",
          lazy: () => import("#renderer/pages/crud-dashboard/component"),
        },
        {
          path: "scanner",
          lazy: () => import("#renderer/pages/scanner/component"),
        },
      ],
      HydrateFallback: RootHydrateFallback,
    },
  ];
};
