import { useProfileStore } from "#renderer/shared/hooks/ui/useProfileStore";
import type { RouteObject } from "react-router";
import { createHashRouter, RouterProvider } from "react-router";
import { DashLayout, RootRoute } from "./layout";
import { RootErrorBoundary, RootHydrateFallback } from "./root";

const routes: RouteObject[] = [
  {
    children: [
      {
        path: "*",
        lazy: () => import("#renderer/pages/not-found/component"),
      },
      {
        children: [
          {
            path: "plc",
            lazy: () => import("#renderer/pages/plc/component"),
          },
          {
            id: "home",
            index: true,
            lazy: () => import("#renderer/pages/home/component"),
          },
          {
            id: "settings",
            path: "settings",
            lazy: () => import("#renderer/pages/settings"),
          },
          {
            id: "log",
            path: "log",
            lazy: () => import("#renderer/pages/log/component"),
          },
          {
            path: "help",
            lazy: () => import("#renderer/pages/help/component"),
          },
          {
            path: "md5_compute",
            lazy: () => import("#renderer/pages/md5_compute/component"),
          },
          {
            path: "md5_backup_image",
            lazy: () => import("#renderer/pages/md5_backup_image/component"),
          },
          {
            path: "chat",
            lazy: () => import("#renderer/pages/chat/component"),
          },
          {
            path: "xml",
            lazy: () => import("#renderer/pages/xml/component"),
          },
          {
            path: "lab",
            lazy: () => import("#renderer/pages/lab/component"),
          },
          {
            path: "minesweeper",
            lazy: () => import("#renderer/pages/minesweeper/component"),
          },
          {
            path: "qrcode",
            lazy: () => import("#renderer/pages/qrcode/component"),
          },
          {
            path: "xlsx",
            children: [
              {
                index: true,
                lazy: () => import("#renderer/pages/xlsx"),
              },
              {
                path: "new",
                lazy: () => import("#renderer/pages/xlsx_new/component"),
              },
              {
                path: ":id",
                children: [
                  {
                    index: true,
                    lazy: () => import("#renderer/pages/xlsx_show/component"),
                  },
                  {
                    path: "edit",
                    lazy: () => import("#renderer/pages/xlsx_edit/component"),
                  },
                ],
              },
            ],
          },
          {
            children: [
              {
                path: "detection",
                children: [
                  {
                    index: true,
                    lazy: () => import("#renderer/pages/detection"),
                  },
                  {
                    path: ":id",
                    lazy: () => import("#renderer/pages/detection_show"),
                  },
                ],
              },
              {
                path: "verify",
                children: [
                  {
                    index: true,
                    lazy: () => import("#renderer/pages/verify"),
                  },
                  {
                    path: ":id",
                    lazy: () => import("#renderer/pages/verify_show"),
                  },
                ],
              },
              {
                path: "quartors",
                children: [
                  {
                    index: true,
                    lazy: () => import("#renderer/pages/quartors"),
                  },
                  {
                    path: ":id",
                    lazy: () => import("#renderer/pages/quartors_show"),
                  },
                ],
              },
              {
                path: "hxzy",
                children: [
                  {
                    index: true,
                    lazy: () => import("#renderer/pages/hxzy_hmis/component"),
                  },
                  {
                    path: "setting",
                    lazy: () =>
                      import("#renderer/pages/hxzy_hmis_setting/component"),
                  },
                  {
                    path: "verifies",
                    lazy: () =>
                      import("#renderer/pages/hxzy_verifies/component"),
                  },
                ],
                loader: async () => {},
              },
              {
                path: "jtv",
                children: [
                  {
                    index: true,
                    lazy: () => import("#renderer/pages/jtv_hmis/component"),
                  },
                  {
                    path: "setting",
                    lazy: () =>
                      import("#renderer/pages/jtv_hmis_setting/component"),
                  },
                ],
                loader: async () => {},
              },
              {
                path: "jtv_xuzhoubei",
                children: [
                  {
                    index: true,
                    lazy: () =>
                      import("#renderer/pages/jtv_hmis_xuzhoubei/component"),
                  },
                  {
                    path: "setting",
                    lazy: () =>
                      import("#renderer/pages/jtv_hmis_xuzhoubei_setting/component"),
                  },
                ],
                loader: async () => {},
              },
              {
                path: "jtv_guangzhoubei",
                children: [
                  {
                    index: true,
                    lazy: () =>
                      import("#renderer/pages/jtv_hmis_guangzhoubei/component"),
                  },
                  {
                    path: "setting",
                    lazy: () =>
                      import("#renderer/pages/jtv_hmis_guangzhoubei_setting/component"),
                  },
                ],
                loader: async () => {},
              },
              {
                path: "jtv_guangzhoujibaoduan",
                children: [
                  {
                    index: true,
                    lazy: () =>
                      import("#renderer/pages/jtv_hmis_guangzhoujibaoduan/component"),
                  },
                  {
                    path: "setting",
                    lazy: () =>
                      import("#renderer/pages/jtv_hmis_guangzhoujibaoduan_setting/component"),
                  },
                ],
                loader: async () => {},
              },
              {
                path: "kh",
                children: [
                  {
                    index: true,
                    lazy: () => import("#renderer/pages/kh_hmis/component"),
                  },
                  {
                    path: "setting",
                    lazy: () =>
                      import("#renderer/pages/kh_hmis_setting/component"),
                  },
                ],
                loader: async () => {},
              },
            ],
          },
        ],
        Component: DashLayout,
      },
    ],
    Component: RootRoute,
    ErrorBoundary: RootErrorBoundary,
    HydrateFallback: RootHydrateFallback,
    loader: async () => {
      await new Promise<void>((resolve) => {
        useProfileStore.persist.onFinishHydration(() => {
          resolve();
        });
      });
    },
  },
];

const router = createHashRouter(routes);
export const AppRouter = () => <RouterProvider router={router} />;
