import {
  createHashRouter,
  type RouteObject,
  RouterProvider,
} from "react-router";
import { QueryProvider } from "#renderer/components/query";
import {
  fetchHxzyHmisSetting,
  fetchJtvHmisSetting,
  fetchJtvHmisXuzhoubeiSetting,
  fetchKhHmisSetting,
  fetchProfile,
} from "#renderer/api/fetch_preload";
import { DashLayout, RootRoute } from "./layout";
import { RootErrorBoundary } from "./error";
import { Box, CircularProgress } from "@mui/material";

const hxzyLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchHxzyHmisSetting());
};

const jtvXuzhoubeiLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchJtvHmisXuzhoubeiSetting());
};

const jtvLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchJtvHmisSetting());
};

const khLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchKhHmisSetting());
};

const RootHydrateFallback = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CircularProgress size={64} />
    </Box>
  );
};

const routes: RouteObject[] = [
  {
    id: "root",
    Component: RootRoute,
    ErrorBoundary: RootErrorBoundary,
    HydrateFallback: RootHydrateFallback,
    loader: async () => {
      await QueryProvider.queryClient.ensureQueryData(fetchProfile());
    },
    children: [
      {
        id: "404",
        path: "*",
        lazy: () => import("#renderer/pages/not-found/component"),
      },
      {
        id: "auth_layout",
        Component: DashLayout,
        children: [
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
            path: "md5_compute",
            lazy: () => import("#renderer/pages/md5_compute/component"),
          },
          {
            path: "md5_backup_image",
            lazy: () => import("#renderer/pages/md5_backup_image/component"),
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
            id: "xlsx",
            path: "xlsx",
            children: [
              {
                id: "xlsx_list",
                index: true,
                lazy: () => import("#renderer/pages/xlsx"),
              },
              {
                id: "xlsx/new",
                path: "new",
                lazy: () => import("#renderer/pages/xlsx_new/component"),
              },
              {
                id: "xlsx_show",
                path: ":id",
                children: [
                  {
                    id: "xlsx/show",
                    index: true,
                    lazy: () => import("#renderer/pages/xlsx_show/component"),
                  },
                  {
                    id: "xlsx/edit",
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
                id: "detection",
                path: "detection",
                children: [
                  {
                    id: "detection/list",
                    index: true,
                    lazy: () => import("#renderer/pages/detection"),
                  },
                  {
                    id: "detection/show",
                    path: ":id",
                    lazy: () => import("#renderer/pages/detection_show"),
                  },
                ],
              },
              {
                id: "verify",
                path: "verify",
                children: [
                  {
                    id: "verify/list",
                    index: true,
                    lazy: () => import("#renderer/pages/verify"),
                  },
                  {
                    id: "verify/show",
                    path: ":id",
                    lazy: () => import("#renderer/pages/verify_show"),
                  },
                ],
              },
              {
                id: "quartors",
                path: "quartors",
                children: [
                  {
                    id: "quartors/list",
                    index: true,
                    lazy: () => import("#renderer/pages/quartors"),
                  },
                  {
                    id: "quartors/show",
                    path: ":id",
                    lazy: () => import("#renderer/pages/quartors_show"),
                  },
                ],
              },
              {
                id: "hxzy_layout",
                loader: hxzyLoader,
                path: "hxzy",
                children: [
                  {
                    id: "hxzy_hmis",
                    index: true,
                    lazy: () => import("#renderer/pages/hxzy_hmis/component"),
                  },
                  {
                    id: "hxzy_hmis_setting",
                    path: "setting",
                    lazy: () =>
                      import("#renderer/pages/hxzy_hmis_setting/component"),
                  },
                  {
                    id: "hxzy_verifies",
                    path: "verifies",
                    lazy: () =>
                      import("#renderer/pages/hxzy_verifies/component"),
                  },
                ],
              },
              {
                id: "jtv_layout",
                loader: jtvLoader,
                path: "jtv",
                children: [
                  {
                    id: "jtv_hmis",
                    index: true,
                    lazy: () => import("#renderer/pages/jtv_hmis/component"),
                  },
                  {
                    id: "jtv_hmis_setting",
                    path: "setting",
                    lazy: () =>
                      import("#renderer/pages/jtv_hmis_setting/component"),
                  },
                ],
              },
              {
                id: "jtv_hmis_xuzhoubei_layout",
                loader: jtvXuzhoubeiLoader,
                path: "jtv_xuzhoubei",
                children: [
                  {
                    id: "jtv_hmis_xuzhoubei",
                    index: true,
                    lazy: () =>
                      import("#renderer/pages/jtv_hmis_xuzhoubei/component"),
                  },
                  {
                    id: "jtv_hmis_xuzhoubei_setting",
                    path: "setting",
                    lazy: () =>
                      import(
                        "#renderer/pages/jtv_hmis_xuzhoubei_setting/component"
                      ),
                  },
                ],
              },
              {
                id: "kh_hmis_layout",
                loader: khLoader,
                path: "kh",
                children: [
                  {
                    id: "kh_hmis",
                    index: true,
                    lazy: () => import("#renderer/pages/kh_hmis/component"),
                  },
                  {
                    id: "kh_hmis_setting",
                    path: "setting",
                    lazy: () =>
                      import("#renderer/pages/kh_hmis_setting/component"),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const router = createHashRouter(routes);
export const RouterUI = () => <RouterProvider router={router} />;
