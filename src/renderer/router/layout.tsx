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
  VpnKeyOutlined,
  PermMediaOutlined,
  CodeOutlined,
  ScienceOutlined,
  SportsEsportsOutlined,
  QrCodeOutlined,
  HelpOutlined,
  ChatOutlined,
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
  useNotifications,
  DashboardLayout,
  PageContainer,
  NotificationsProvider,
  DialogsProvider,
} from "@toolpad/core";
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import {
  useMobileMode,
  fetchProfile,
  useProfileUpdate,
} from "#renderer/api/fetch_preload";
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

  const fetcher = fetchProfile();
  const profile = useQuery(fetcher);
  const queryClient = useQueryClient();
  const snackbar = useNotifications();
  const updateSettings = useProfileUpdate();

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

  const render = () => {
    if (!profile.isSuccess) return null;

    const mode = profile.data.mode;

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

  return render();
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
  const fetcher = fetchProfile();
  const profile = useQuery(fetcher);
  const queryClient = useQueryClient();
  const snackbar = useNotifications();
  const updateSettings = useProfileUpdate();

  const render = () => {
    if (!profile.isSuccess) return null;

    const alwaysOnTop = profile.data.alwaysOnTop;

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

  return render();
};

const segmentAlias = new Map([
  ["hxzy", "华兴致远"],
  ["jtv", "京天威"],
  ["jtv_xuzhoubei", "京天威(徐州北)"],
  ["jtv_guangzhoubei", "京天威(广州北)"],
  ["kh", "康华"],
  ["verifies", "日常校验"],
  ["setting", "设置"],
  ["detection", "现车作业"],
  ["verify", "日常校验"],
  ["quartors", "季度校验"],
  ["settings", "设置"],
  ["setting", "设置"],
  ["log", "日志"],
  ["md5_compute", "MD5计算"],
  ["md5_backup_image", "图片备份"],
  ["lab", "实验室"],
  ["help", "帮助"],
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
    title: "京天威(广州北)",
    segment: "jtv_guangzhoubei",
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
  {
    segment: "help",
    title: "帮助",
    icon: <HelpOutlined />,
  },
];

const addLabRoutes = (shouldAdd: boolean) => {
  if (!shouldAdd) return;

  NAVIGATION.push(
    {
      segment: "md5_compute",
      title: "MD5计算",
      icon: <VpnKeyOutlined />,
    },
    {
      segment: "md5_backup_image",
      title: "图片备份",
      icon: <PermMediaOutlined />,
    },
    {
      segment: "xml",
      title: "XML",
      icon: <CodeOutlined />,
    },
    {
      segment: "lab",
      title: "实验室",
      icon: <ScienceOutlined />,
    },
    {
      segment: "minesweeper",
      title: "Minesweeper",
      icon: <SportsEsportsOutlined />,
    },
    { segment: "qrcode", title: "QRCode", icon: <QrCodeOutlined /> },
    { segment: "chat", title: "QRCode", icon: <ChatOutlined /> },
  );
};

addLabRoutes(true);

export const RootRoute = () => {
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
            anchorOrigin: { vertical: "top", horizontal: "right" },
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
