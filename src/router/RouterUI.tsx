import {
  createHashRouter,
  Outlet,
  RouteObject,
  RouterProvider,
} from "react-router";
import { AuthLayout } from "@/components/layout";
import React from "react";
import { NprogressBar } from "@/components/NprogressBar";
import {
  useIndexedStore,
  useIndexedStoreHasHydrated,
} from "@/hooks/useIndexedStore";
import { Box, Button, CircularProgress, TextField } from "@mui/material";
import dayjs from "dayjs";
import type { Log } from "@/hooks/useIndexedStore";
import { useLocalStore, useLocalStoreHasHydrated } from "@/hooks/useLocalStore";
import { queryOptions, useQuery } from "@tanstack/react-query";

const LogWrapper = (props: React.PropsWithChildren) => {
  const set = useIndexedStore((s) => s.set);

  React.useEffect(() => {
    const listener = (data: Log) => {
      set((d) => {
        // Remove logs that are not today
        d.logs = d.logs.filter((i) =>
          dayjs(i.date).isAfter(dayjs().startOf("day"))
        );

        // Add new log
        d.logs.push(data);

        // Deduplicate logs by id
        const map = new Map<string, Log>();
        d.logs.forEach((i) => {
          map.set(i.id, i);
        });
        d.logs = Array.from(map.values());
      });
    };

    const unsubscribe = window.electronAPI.subscribeLog(listener);

    return () => {
      unsubscribe();
    };
  }, [set]);

  return props.children;
};

export const RootRoute = () => {
  return (
    <>
      <NprogressBar />
      <Outlet />
    </>
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

const useNativeTheme = () => {
  const mode = useLocalStore((s) => s.mode);

  React.useEffect(() => {
    window.electronAPI.toggleMode(mode);
  }, [mode]);
};

const useAlwaysOnTop = () => {
  const alwaysOnTop = useLocalStore((s) => s.alwaysOnTop);

  React.useEffect(() => {
    window.electronAPI.setAlwaysOnTop(alwaysOnTop);
  }, [alwaysOnTop]);
};

const AuthWrapper = () => {
  useNativeTheme();
  useAlwaysOnTop();
  const hasHydrated = useIndexedStoreHasHydrated();
  const localHasHydrated = useLocalStoreHasHydrated();

  return (
    <AuthLayout>
      <LogWrapper>{renderOutlet(hasHydrated && localHasHydrated)}</LogWrapper>
    </AuthLayout>
  );
};

const fetchActivation = () =>
  queryOptions({
    queryKey: ["fetchActivateCode"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { isOk: false };
    },
  });

const ActivationGuard = () => {
  const [activateCode, setActivateCode] = React.useState("");

  const activation = useQuery({
    ...fetchActivation(),
    enabled: !!activateCode,

    retry: false,

    // Disable automatic refetching
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,

    // Disable garbage collection
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!activateCode) {
    return (
      <Box>
        please input activateCode
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActivateCode("ad");
          }}
        >
          <TextField />
          <Button type="submit">click me</Button>
        </form>
      </Box>
    );
  }

  if (activation.isPending) {
    return (
      <Box>
        <CircularProgress />
      </Box>
    );
  }

  if (activation.isError) {
    return <Box>{activation.error.message}</Box>;
  }

  return <Outlet />;
};

const routes: RouteObject[] = [
  {
    id: "root",
    path: "",
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
            id: "settings",
            path: "settings",
            lazy: () => import("@/pages/settings/route"),
          },
          { id: "log", path: "log", lazy: () => import("@/pages/log/route") },
          {
            id: "activate",
            path: "",
            Component: ActivationGuard,
            children: [
              {
                id: "detection",
                path: "detection",
                lazy: () => import("@/pages/detection/route"),
              },

              {
                id: "quartors",
                path: "quartors",
                lazy: () => import("@/pages/quartors/route"),
              },

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
                id: "hxzy_verifies",
                path: "hxzy_verifies",
                lazy: () => import("@/pages/hxzy_verifies/route"),
              },
              {
                id: "jtv_hmis",
                path: "jtv_hmis",
                lazy: () => import("@/pages/jtv_hmis/route"),
              },
              {
                id: "jtv_hmis_setting",
                path: "jtv_hmis_setting",
                lazy: () => import("@/pages/jtv_hmis_setting/route"),
              },
              {
                id: "jtv_hmis_xuzhoubei",
                path: "jtv_hmis_xuzhoubei",
                lazy: () => import("@/pages/jtv_hmis_xuzhoubei/route"),
              },
              {
                id: "jtv_hmis_xuzhoubei_setting",
                path: "jtv_hmis_xuzhoubei_setting",
                lazy: () => import("@/pages/jtv_hmis_xuzhoubei_setting/route"),
              },
              {
                id: "kh_hmis",
                path: "kh_hmis",
                lazy: () => import("@/pages/kh_hmis/route"),
              },
              {
                id: "kh_hmis_setting",
                path: "kh_hmis_setting",
                lazy: () => import("@/pages/kh_hmis_setting/route"),
              },
            ],
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
