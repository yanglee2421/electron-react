import {
  createHashRouter,
  Navigate,
  Outlet,
  RouteObject,
  RouterProvider,
  useLocation,
  useParams,
} from "react-router";
import { AuthLayout } from "@/components/layout";
import React from "react";
import { NprogressBar } from "@/components/NprogressBar";
import { useIndexedStoreHasHydrated } from "@/hooks/useIndexedStore";
import { Box, CircularProgress } from "@mui/material";

const LANGS = new Set(["en", "zh"]);
const FALLBACK_LANG = "en";
const getMatchedLang = (path = "", state: string) => {
  if (LANGS.has(path)) {
    return path;
  }

  if (LANGS.has(state)) {
    return state;
  }

  return FALLBACK_LANG;
};

export const LangWrapper = (props: React.PropsWithChildren) => {
  const params = useParams();
  const location = useLocation();
  const matchedLang = getMatchedLang(params.lang, "zh");

  if (matchedLang !== params.lang) {
    return (
      <Navigate
        to={{
          pathname: `/${matchedLang + location.pathname}`,
          search: location.search,
          hash: location.hash,
        }}
        state={location.state}
        replace
      />
    );
  }

  return props.children;
};

export const RootRoute = () => {
  return (
    <LangWrapper>
      <Outlet />
    </LangWrapper>
  );
};

const renderOutlet = (hasHydrated: boolean) => {
  if (!hasHydrated) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 6,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <Outlet />;
};

const AuthWrapper = () => {
  const hasHydrated = useIndexedStoreHasHydrated();

  return (
    <AuthLayout>
      <NprogressBar />
      {renderOutlet(hasHydrated)}
    </AuthLayout>
  );
};

const routes: RouteObject[] = [
  {
    id: "root",
    path: ":lang?",
    Component: RootRoute,
    children: [
      {
        id: "404",
        path: "*",
        lazy() {
          return import("@/pages/not-found/route");
        },
      },
      {
        id: "auth_layout",
        Component: AuthWrapper,
        children: [
          {
            id: "home",
            index: true,
            lazy: () => import("@/pages/home/route"),
          },
          {
            id: "detection",
            path: "detection",
            lazy: () => import("@/pages/detection/route"),
          },
          {
            id: "verifies",
            path: "verifies",
            lazy: () => import("@/pages/verifies/route"),
          },
          {
            id: "quartors",
            path: "quartors",
            lazy: () => import("@/pages/quartors/route"),
          },
          {
            id: "settings",
            path: "settings",
            lazy: () => import("@/pages/settings/route"),
          },
          { id: "log", path: "log", lazy: () => import("@/pages/log/route") },
          {
            id: "hxzy_hmis",
            path: "hxzy_hmis",
            lazy: () => import("@/pages/hxzy_hmis/route"),
          },
          {
            id: "hxzy_hmis_setting",
            path: "hxzy_hmis_setting",
            lazy: () => import("@/pages/hxzy_hmis_setting/route"),
          },
          {
            id: "jtv_hmis",
            path: "jtv_hmis",
            lazy: () => import("@/pages/jtv_hmis/route"),
          },
        ],
      },
    ],
  },
];

const router = createHashRouter(routes);

export const RouterUI = () => {
  return <RouterProvider router={router} />;
};
