import {
  usePrefetchQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import React from "react";
import {
  Box,
  Button,
  IconButton,
  useTheme,
  Alert,
  AlertTitle,
  Typography,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import {
  DarkModeOutlined,
  DesktopWindowsOutlined,
  HomeOutlined,
  LightModeOutlined,
  PhonelinkOutlined,
  PushPin,
  PushPinOutlined,
} from "@mui/icons-material";
import {
  createHashRouter,
  RouteObject,
  RouterProvider,
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  Link,
  ScrollRestoration,
} from "react-router";
import { Loading } from "@/components/Loading";
import { NavMenu } from "./nav";
import { QueryProvider } from "@/components/query";
import {
  fetchHxzyHmisSetting,
  fetchJtvHmisSetting,
  fetchJtvHmisXuzhoubeiSetting,
  fetchKhHmisSetting,
  fetchSettings,
  useMobileMode,
  useUpdateSettings,
} from "@/api/fetch_preload";
import {
  DashboardLayout,
  DialogsProvider,
  NotificationsProvider,
  PageContainer,
  useActivePage,
  useNotifications,
} from "@toolpad/core";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { NprogressBar } from "./nprogress";
import { ActivationForm } from "./activation";

const renderModeIcon = (mode: string) => {
  switch (mode) {
    case "light":
      return <LightModeOutlined />;
    case "dark":
      return <DarkModeOutlined />;
    case "system":
    default:
      return <DesktopWindowsOutlined />;
  }
};

const ModeToggle = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const fetcher = fetchSettings();
  const { data: settings } = useQuery(fetcher);
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const snackbar = useNotifications();

  /**
   * Already ensured query data in the loader
   * @see authLayoutLoader
   * But we need to check if the data is valid
   */
  if (!settings) {
    throw new Error("请先加载设置");
  }

  const mode = settings.mode;
  const setMode = (newMode: "system" | "light" | "dark") => {
    queryClient.setQueryData(fetcher.queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        mode: newMode,
      };
    });
    updateSettings.mutate(
      { mode: newMode },
      {
        onError: () => {
          snackbar.show("设置失败", {
            severity: "error",
          });
        },
      },
    );
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        {renderModeIcon(mode)}
      </IconButton>
      <Menu
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setMode("light");
          }}
        >
          <ListItemIcon>
            <LightModeOutlined />
          </ListItemIcon>
          <ListItemText primary="明亮" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setMode("dark");
          }}
        >
          <ListItemIcon>
            <DarkModeOutlined />
          </ListItemIcon>
          <ListItemText primary="黑暗" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setMode("system");
          }}
        >
          <ListItemIcon>
            <DesktopWindowsOutlined />
          </ListItemIcon>
          <ListItemText primary="系统" />
        </MenuItem>
      </Menu>
    </>
  );
};

const MobileModeButton = () => {
  const mobileMode = useMobileMode();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <IconButton
      onClick={() => {
        mobileMode.mutate(!isSmallScreen);
      }}
    >
      <PhonelinkOutlined color={isSmallScreen ? "primary" : void 0} />
    </IconButton>
  );
};

const AlwaysOnTop = () => {
  const fetcher = fetchSettings();
  const { data: settings } = useQuery(fetcher);
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const snackbar = useNotifications();

  const alwaysOnTop = settings?.alwaysOnTop;

  return (
    <IconButton
      onClick={() => {
        queryClient.setQueryData(fetcher.queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            alwaysOnTop: !old.alwaysOnTop,
          };
        });

        updateSettings.mutate(
          {
            alwaysOnTop: !alwaysOnTop,
          },
          {
            onError: () => {
              snackbar.show("设置失败", {
                severity: "error",
              });
            },
          },
        );
      }}
    >
      {alwaysOnTop ? <PushPin /> : <PushPinOutlined />}
    </IconButton>
  );
};

const DashLayout = () => {
  const activePage = useActivePage();

  return (
    <DashboardLayout
      slots={{
        toolbarAccount: () => (
          <>
            <MobileModeButton />
            <AlwaysOnTop />
            <ModeToggle />
          </>
        ),
      }}
    >
      <PageContainer breadcrumbs={activePage?.breadcrumbs}>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
};

const ActivationGuard = () => {
  const activation = ActivationForm.useActivation();

  if (activation.isPending) {
    return <Loading />;
  }

  if (activation.isError) {
    return <Box>{activation.error.message}</Box>;
  }

  if (!activation.data.isOk) {
    return <ActivationForm />;
  }

  return <Outlet />;
};

const usePrefetchActivation = () =>
  usePrefetchQuery(ActivationForm.fetchActivation());

const RootRoute = () => {
  usePrefetchActivation();
  const theme = useTheme();

  return (
    <ReactRouterAppProvider
      navigation={NavMenu.list}
      branding={{
        title: "武铁紫云接口面板",
      }}
      theme={theme}
    >
      <NprogressBar />
      <NotificationsProvider
        slotProps={{
          snackbar: {
            anchorOrigin: { vertical: "top", horizontal: "center" },
            autoHideDuration: 1000 * 3,
          },
        }}
      >
        <DialogsProvider>
          <Outlet />
        </DialogsProvider>
      </NotificationsProvider>
      <ScrollRestoration />
    </ReactRouterAppProvider>
  );
};

const renderError = (error: unknown) => {
  if (isRouteErrorResponse(error)) {
    return (
      <Alert severity="error" variant="outlined">
        <AlertTitle>{error.status}</AlertTitle>
        <Typography>{error.statusText}</Typography>
        <Link to="/">
          <Button startIcon={<HomeOutlined />}>返回首页</Button>
        </Link>
      </Alert>
    );
  }

  if (error instanceof Error) {
    return (
      <Alert severity="error" variant="outlined">
        <AlertTitle>错误</AlertTitle>
        <Typography>{error.message}</Typography>
        <Typography variant="body2">{error.stack}</Typography>
        <Link to="/">
          <Button startIcon={<HomeOutlined />} color="error">
            返回首页
          </Button>
        </Link>
      </Alert>
    );
  }

  return (
    <Alert severity="error" variant="outlined">
      <AlertTitle>错误</AlertTitle>
      <Typography>未知错误，请联系服务人员</Typography>
      <Link to="/">
        <Button startIcon={<HomeOutlined />} color="error">
          返回首页
        </Button>
      </Link>
    </Alert>
  );
};

const RootErrorBoundary = () => {
  const error = useRouteError();

  return <Box sx={{ padding: 6 }}>{renderError(error)}</Box>;
};

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
                lazy: () => import("@/pages/detection/component"),
              },
              {
                id: "verify",
                path: "verify",
                children: [
                  {
                    id: "verify_list",
                    index: true,
                    lazy: () => import("@/pages/verify/component"),
                  },
                  {
                    id: "verify_show",
                    path: ":id",
                    lazy: () => import("@/pages/verify_show"),
                  },
                ],
              },
              {
                id: "quartors",
                path: "quartors",
                lazy: () => import("@/pages/quartors/component"),
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
