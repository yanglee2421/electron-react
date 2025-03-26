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

const AuthWrapper = () => {
  return (
    <AuthLayout>
      <NprogressBar />
      <Outlet />
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
            path: "home",
            lazy: () => import("@/pages/home/route"),
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
            id: "hmis",
            index: true,
            lazy: () => import("@/pages/hmis/route"),
          },
          {
            id: "settings",
            path: "settings",
            lazy: () => import("@/pages/settings/route"),
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
