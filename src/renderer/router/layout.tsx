import {
  fetchSettings,
  useUpdateSettings,
  useMobileMode,
} from "@/api/fetch_preload";
import {
  LightModeOutlined,
  DarkModeOutlined,
  DesktopWindowsOutlined,
  PhonelinkOutlined,
  PushPin,
  PushPinOutlined,
  QrCodeScannerOutlined,
  CalendarTodayOutlined,
  TuneOutlined,
  TrainOutlined,
  CalendarMonthOutlined,
  InfoOutlined,
  SettingsOutlined,
} from "@mui/icons-material";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material";
import {
  useQuery,
  useQueryClient,
  usePrefetchQuery,
} from "@tanstack/react-query";
import {
  useNotifications,
  DashboardLayout,
  PageContainer,
  NotificationsProvider,
  DialogsProvider,
} from "@toolpad/core";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import React from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { ActivationForm } from "./activation";
import { NprogressBar } from "./nprogress";
import type { Navigation } from "@toolpad/core";

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
    document.startViewTransition(async () => {
      queryClient.setQueryData(fetcher.queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          mode: newMode,
        };
      });
      await updateSettings.mutateAsync(
        { mode: newMode },
        {
          onError: () => {
            snackbar.show("设置失败", {
              severity: "error",
            });
          },
        },
      );
    });
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

const segmentAlias = new Map([
  ["hxzy", "华兴致远"],
  ["jtv", "京天威"],
  ["jtv_xuzhoubei", "京天威(徐州北)"],
  ["kh", "康华"],
  ["verifies", "日常校验"],
  ["setting", "设置"],
  ["detection", "现车作业"],
  ["verify", "日常校验"],
  ["quartors", "季度校验"],
  ["settings", "设置"],
  ["setting", "设置"],
  ["log", "日志"],
]);

const alias = (title: string) => segmentAlias.get(title) || title;

export const DashLayout = () => {
  const location = useLocation();

  const segments =
    location.pathname.split("/").filter((path) => {
      if (!path) return false;

      return true;
    }) || [];

  const renderTitle = () => {
    const segment = segments[segments.length - 1];
    if (!segment) return;

    const title = decodeURIComponent(segment);

    return alias(title);
  };

  const renderBreadcrumbs = () => {
    return segments.map((segment, idx) => {
      const title = decodeURIComponent(segment);

      return {
        title: alias(title),
        path: Object.is(idx + 1, segments.length)
          ? void 0
          : ["", ...segments.slice(0, idx + 1)].join("/"),
      };
    });
  };

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
      <PageContainer title={renderTitle()} breadcrumbs={renderBreadcrumbs()}>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
};

const NAVIGATION: Navigation = [
  {
    kind: "header",
    title: "HMIS",
  },
  {
    title: "华兴致远",
    segment: "hxzy",
    children: [
      {
        segment: "/",
        title: "HMIS",
        icon: <QrCodeScannerOutlined />,
      },
      {
        segment: "verifies",
        title: "日常校验",
        icon: <CalendarTodayOutlined />,
      },
      {
        segment: "setting",
        title: "设置",
        icon: <TuneOutlined />,
      },
    ],
  },
  {
    title: "京天威",
    segment: "jtv",
    children: [
      {
        title: "HMIS",
        icon: <QrCodeScannerOutlined />,
      },
      {
        segment: "setting",
        title: "设置",
        icon: <TuneOutlined />,
      },
    ],
  },
  {
    title: "京天威(徐州北)",
    segment: "jtv_xuzhoubei",
    children: [
      {
        title: "HMIS",
        icon: <QrCodeScannerOutlined />,
      },
      {
        segment: "setting",
        title: "设置",
        icon: <TuneOutlined />,
      },
    ],
  },
  {
    title: "康华",
    segment: "kh",
    children: [
      {
        title: "HMIS",
        icon: <QrCodeScannerOutlined />,
      },
      {
        segment: "setting",
        title: "设置",
        icon: <TuneOutlined />,
      },
    ],
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "常规",
  },
  {
    segment: "detection",
    title: "现车作业",
    icon: <TrainOutlined />,
  },
  {
    segment: "verify",
    title: "日常校验",
    icon: <CalendarTodayOutlined />,
  },
  {
    segment: "quartors",
    title: "季度校验",
    icon: <CalendarMonthOutlined />,
  },
  {
    segment: "xlsx",
    title: "xlsx设置",
    icon: <SettingsOutlined />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "其它",
  },
  {
    segment: "log",
    title: "日志",
    icon: <InfoOutlined />,
  },
  {
    segment: "settings",
    title: "设置",
    icon: <SettingsOutlined />,
  },
];

export const RootRoute = () => {
  usePrefetchQuery(ActivationForm.fetchActivation());
  const theme = useTheme();

  return (
    <ReactRouterAppProvider
      navigation={NAVIGATION}
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
