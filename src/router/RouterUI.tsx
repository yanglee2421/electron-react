import {
  createHashRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useParams,
} from "react-router";
import { MuiProvider } from "@/components/MuiProvider";
import { AuthLayout } from "@/components/layout/AuthLayout";
import * as channel from "@electron/channel";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { ipcRenderer } from "@/lib/utils";
import {
  useIndexedStore,
  useIndexedStoreHasHydrated,
} from "@/hooks/useIndexedStore";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Skeleton,
  Snackbar,
} from "@mui/material";
import { useStore } from "@/hooks/useStore";

const fetchHeartbeat = (params: channel.DbParamsBase) =>
  queryOptions({
    queryKey: [channel.heartbeat, params],
    queryFn() {
      return ipcRenderer.invoke(channel.heartbeat, params);
    },
  });

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
          const hasHydrated = useIndexedStoreHasHydrated();
          const msg = useStore((s) => s.msg);
          const set = useStore((s) => s.set);

          return (
            <AuthLayout key={location.pathname}>
              {hasHydrated ? <Outlet /> : <CircularProgress />}
              <Snackbar
                open={!!msg}
                autoHideDuration={1000 * 6}
                message={msg}
                onClose={() =>
                  set((s) => {
                    s.msg = "";
                  })
                }
              />
            </AuthLayout>
          );
        },
        children: [
          {
            id: "heartbeat",
            path: "",
            Component() {
              const settings = useIndexedStore((s) => s.settings);
              const heartbeat = useQuery({
                ...fetchHeartbeat({
                  dsn: settings.databaseDsn,
                  path: settings.databasePath,
                  password: settings.databasePassword,
                }),
                refetchInterval(query) {
                  if (query.state.error) {
                    return false;
                  }

                  return settings.refetchInterval;
                },
              });

              if (heartbeat.isPending) {
                return (
                  <>
                    <Skeleton />
                    <Skeleton />
                    <Skeleton />
                  </>
                );
              }

              if (heartbeat.isError) {
                return (
                  <Alert severity="error">
                    <AlertTitle>Connect to Database failed</AlertTitle>
                    <p>{heartbeat.error.message}</p>
                    <Button
                      component={Link}
                      to={{ pathname: "settings" }}
                      color="error"
                    >
                      Settings
                    </Button>
                  </Alert>
                );
              }

              return <Outlet />;
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
            ],
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
