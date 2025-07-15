import {
  createHashRouter,
  type RouteObject,
  RouterProvider,
} from "react-router";
import { QueryProvider } from "@/components/query";
import {
  fetchHxzyHmisSetting,
  fetchJtvHmisSetting,
  fetchJtvHmisXuzhoubeiSetting,
  fetchKhHmisSetting,
  fetchSettings,
} from "@/api/fetch_preload";
import { ActivationForm, ActivationGuard } from "./activation";
import { DashLayout, RootRoute } from "./layout";
import { RootErrorBoundary } from "./error";

const authLayoutLoader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchSettings());
};

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

const routes: RouteObject[] = [
  {
    id: "root",
    Component: RootRoute,
    ErrorBoundary: RootErrorBoundary,
    children: [
      {
        id: "404",
        path: "*",
        lazy: () => import("@/pages/not-found/component"),
      },
      {
        id: "auth_layout",
        Component: DashLayout,
        loader: authLayoutLoader,
        children: [
          {
            id: "home",
            index: true,
            lazy: () => import("@/pages/home/component"),
          },
          {
            id: "settings",
            path: "settings",
            lazy: () => import("@/pages/settings"),
          },
          {
            id: "log",
            path: "log",
            lazy: () => import("@/pages/log/component"),
          },
          {
            id: "xlsx",
            path: "xlsx",
            children: [
              {
                id: "xlsx_list",
                index: true,
                lazy: () => import("@/pages/xlsx"),
              },
              {
                id: "xlsx/new",
                path: "new",
                lazy: () => import("@/pages/xlsx_new/component"),
              },
              {
                id: "xlsx_show",
                path: ":id",
                children: [
                  {
                    id: "xlsx/show",
                    index: true,
                    lazy: () => import("@/pages/xlsx_show/component"),
                  },
                  {
                    id: "xlsx/edit",
                    path: "edit",
                    lazy: () => import("@/pages/xlsx_edit/component"),
                  },
                ],
              },
            ],
          },
          {
            id: "activation_guard",
            Component: ActivationGuard,
            loader: async () => {
              await QueryProvider.queryClient.ensureQueryData(
                ActivationForm.fetchActivation(),
              );
            },
            children: [
              {
                id: "detection",
                path: "detection",
                children: [
                  {
                    id: "detection/list",
                    index: true,
                    lazy: () => import("@/pages/detection"),
                  },
                  {
                    id: "detection/show",
                    path: ":id",
                    lazy: () => import("@/pages/detection_show"),
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
                    lazy: () => import("@/pages/verify/component"),
                  },
                  {
                    id: "verify/show",
                    path: ":id",
                    lazy: () => import("@/pages/verify_show"),
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
                    lazy: () => import("@/pages/quartors/component"),
                  },
                  {
                    id: "quartors/show",
                    path: ":id",
                    lazy: () => import("@/pages/quartors_show"),
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
                    lazy: () => import("@/pages/hxzy_hmis/component"),
                  },
                  {
                    id: "hxzy_hmis_setting",
                    path: "setting",
                    lazy: () => import("@/pages/hxzy_hmis_setting/component"),
                  },
                  {
                    id: "hxzy_verifies",
                    path: "verifies",
                    lazy: () => import("@/pages/hxzy_verifies/component"),
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
                    lazy: () => import("@/pages/jtv_hmis/component"),
                  },
                  {
                    id: "jtv_hmis_setting",
                    path: "setting",
                    lazy: () => import("@/pages/jtv_hmis_setting/component"),
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
                    lazy: () => import("@/pages/jtv_hmis_xuzhoubei/component"),
                  },
                  {
                    id: "jtv_hmis_xuzhoubei_setting",
                    path: "setting",
                    lazy: () =>
                      import("@/pages/jtv_hmis_xuzhoubei_setting/component"),
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
                    lazy: () => import("@/pages/kh_hmis/component"),
                  },
                  {
                    id: "kh_hmis_setting",
                    path: "setting",
                    lazy: () => import("@/pages/kh_hmis_setting/component"),
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
