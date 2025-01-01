import {
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useParams,
} from "react-router";
import { MuiProvider } from "@/components/MuiProvider";
import { AuthLayout } from "@/components/layout/AuthLayout";

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

const RootRoute = () => {
  const location = useLocation();
  const params = useParams();
  const matchedLang = getMatchedLang(params.lang, "zh");
  const matched = matchedLang === params.lang;

  return (
    <MuiProvider>
      {matched ? (
        <Outlet />
      ) : (
        <Navigate
          to={{
            pathname: `/${matchedLang + location.pathname}`,
            search: location.search,
            hash: location.hash,
          }}
          state={location.state}
          replace
        />
      )}
    </MuiProvider>
  );
};

const router = createHashRouter([
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
        Component() {
          const location = useLocation();
          return (
            <AuthLayout key={location.pathname}>
              <Outlet />
            </AuthLayout>
          );
        },
        children: [
          {
            id: "home",
            index: true,
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
            path: "hmis",
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
]);

export const RouterUI = () => {
  return <RouterProvider router={router} />;
};
