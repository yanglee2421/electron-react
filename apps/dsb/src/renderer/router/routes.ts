import type { RouteObject } from "react-router";

export const createRoutes = (): RouteObject[] => {
  return [
    {
      children: [
        {
          index: true,
          lazy: () => import("#renderer/pages/dashboard/component"),
        },
        {
          path: "/crud-dashboard",
          lazy: () => import("#renderer/pages/crud-dashboard/component"),
        },
      ],
    },
  ];
};
