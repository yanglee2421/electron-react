import { RootComponent } from "./root";
import { RootErrorBoundary } from "../error";
import type { RouteObject } from "react-router";

export const createRoutes = (): RouteObject[] => {
  return [
    {
      ErrorBoundary: RootErrorBoundary,
      Component: RootComponent,
      children: [
        {
          path: "*",
          lazy: () => import("#renderer/pages/not-found/component"),
        },
      ],
    },
  ];
};
