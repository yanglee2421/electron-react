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
  Memory,
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
import { useQuery } from "@tanstack/react-query";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import {
  useMobileMode,
  fetchProfile,
  useProfileUpdate,
} from "#renderer/api/fetch_preload";
import { NprogressBar } from "./nprogress";
import type { Navigation } from "@toolpad/core";

const createSegmentAlias = () => {
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

  return segmentAlias;
};

const calculateAlias = (segmentAlias: Map<string, string>, title: string) => {
  return segmentAlias.get(title) || title;
};

const normalizePathname = (pathname: string) => {
  let result = pathname;

  const isStartWithSlash = pathname.startsWith("/");
  if (!isStartWithSlash) {
    result = "/" + result;
  }

  const isEndWithSlash = pathname.endsWith("/");
  if (isEndWithSlash) {
    result = result.replace(/\/&/, "");
  }

  return result;
};

const calculateTitle = (
  pathname: string,
  segmentAlias: Map<string, string>,
) => {
  const segments = normalizePathname(pathname).split("/");

  const lastSegment = segments.at(-1);
  if (!lastSegment) return;

  const title = decodeURIComponent(lastSegment);

  return calculateAlias(segmentAlias, title);
};

const calculateBreadcrumbs = (
  pathname: string,
  segmentAlias: Map<string, string>,
): React.ComponentProps<typeof PageContainer>["breadcrumbs"] => {
  const segments = normalizePathname(pathname).split("/");

  const breadcrumbs = segments.slice(1).map((segment, index, array) => {
    const title = decodeURIComponent(segment);

    return {
      title: calculateAlias(segmentAlias, title),
      path: Object.is(index + 1, array.length)
        ? void 0
        : normalizePathname(segments.slice(0, index).join("/")),
    };
  });
  return breadcrumbs;
};

const calculateSegment = (...args: string[]) => {
  return args.join("/");
};

const createNavigation = (shouldAdd: boolean): Navigation => {
  const result: Navigation = [
    {
      kind: "header",
      title: "HMIS",
    },
    {
      title: "华兴致远",
      children: [
        {
          segment: calculateSegment("hxzy"),
          title: "HMIS",
          icon: <QrCodeScannerOutlined />,
        },
        {
          segment: calculateSegment("hxzy", "verifies"),
          title: "日常校验",
          icon: <CalendarTodayOutlined />,
        },
        {
          segment: calculateSegment("hxzy", "setting"),
          title: "设置",
          icon: <TuneOutlined />,
        },
      ],
    },
    {
      title: "京天威",
      children: [
        {
          segment: calculateSegment("jtv"),
          title: "HMIS",
          icon: <QrCodeScannerOutlined />,
        },
        {
          segment: calculateSegment("jtv", "setting"),
          title: "设置",
          icon: <TuneOutlined />,
        },
      ],
    },
    {
      title: "京天威(徐州北)",
      children: [
        {
          segment: calculateSegment("jtv_xuzhoubei"),
          title: "HMIS",
          icon: <QrCodeScannerOutlined />,
        },
        {
          segment: calculateSegment("jtv_xuzhoubei", "setting"),
          title: "设置",
          icon: <TuneOutlined />,
        },
      ],
    },
    {
      title: "京天威(广州北)",
      children: [
        {
          segment: calculateSegment("jtv_guangzhoubei"),
          title: "HMIS",
          icon: <QrCodeScannerOutlined />,
        },
        {
          segment: calculateSegment("jtv_guangzhoubei", "setting"),
          title: "设置",
          icon: <TuneOutlined />,
        },
      ],
    },
    {
      title: "康华",
      children: [
        {
          segment: calculateSegment("kh"),
          title: "HMIS",
          icon: <QrCodeScannerOutlined />,
        },
        {
          segment: calculateSegment("kh", "setting"),
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
      segment: calculateSegment("detection"),
      title: "现车作业",
      icon: <TrainOutlined />,
    },
    {
      segment: calculateSegment("verify"),
      title: "日常校验",
      icon: <CalendarTodayOutlined />,
    },
    {
      segment: calculateSegment("quartors"),
      title: "季度校验",
      icon: <CalendarMonthOutlined />,
    },
    {
      segment: calculateSegment("xlsx"),
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
      segment: calculateSegment("log"),
      title: "日志",
      icon: <InfoOutlined />,
    },
    {
      segment: calculateSegment("settings"),
      title: "设置",
      icon: <SettingsOutlined />,
    },
    {
      segment: calculateSegment("help"),
      title: "帮助",
      icon: <HelpOutlined />,
    },
    {
      segment: calculateSegment("plc"),
      title: "PLC",
      icon: <Memory />,
    },
  ];

  if (shouldAdd) {
    result.push(
      {
        segment: calculateSegment("md5_compute"),
        title: "MD5计算",
        icon: <VpnKeyOutlined />,
      },
      {
        segment: calculateSegment("md5_backup_image"),
        title: "图片备份",
        icon: <PermMediaOutlined />,
      },
      {
        segment: calculateSegment("xml"),
        title: "XML",
        icon: <CodeOutlined />,
      },
      {
        segment: calculateSegment("lab"),
        title: "实验室",
        icon: <ScienceOutlined />,
      },
      {
        segment: calculateSegment("minesweeper"),
        title: "Minesweeper",
        icon: <SportsEsportsOutlined />,
      },
      {
        segment: calculateSegment("qrcode"),
        title: "QRCode",
        icon: <QrCodeOutlined />,
      },
      {
        segment: calculateSegment("chat"),
        title: "Chat",
        icon: <ChatOutlined />,
      },
    );
  }

  return result;
};

type ModeIconProps = {
  mode: string;
};

const ModeIcon = ({ mode }: ModeIconProps) => {
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
  const snackbar = useNotifications();
  const updateSettings = useProfileUpdate();

  const setMode = (newMode: "system" | "light" | "dark") => {
    document.startViewTransition(async () => {
      await updateSettings.mutateAsync(
        { mode: newMode },
        {
          onError: () => {
            snackbar.show("设置失败", { severity: "error" });
          },
        },
      );
    });
  };

  if (!profile.isSuccess) {
    return null;
  }

  const mode = profile.data.mode;

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <ModeIcon mode={mode} />
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
  const theme = useTheme();
  const mobileMode = useMobileMode();
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
  const snackbar = useNotifications();
  const updateSettings = useProfileUpdate();

  if (!profile.isSuccess) {
    return null;
  }

  const alwaysOnTop = profile.data.alwaysOnTop;

  return (
    <IconButton
      onClick={() => {
        updateSettings.mutate(
          {
            alwaysOnTop: !alwaysOnTop,
          },
          {
            onError: () => {
              snackbar.show("设置失败", { severity: "error" });
            },
          },
        );
      }}
      disabled={profile.isFetching}
    >
      {alwaysOnTop ? <PushPin /> : <PushPinOutlined />}
    </IconButton>
  );
};

const ToolbarAccount = () => {
  return (
    <>
      <MobileModeButton />
      <AlwaysOnTop />
      <ModeToggle />
    </>
  );
};

export const DashLayout = () => {
  const location = useLocation();

  const segmentAlias = createSegmentAlias();
  const title = calculateTitle(location.pathname, segmentAlias);
  const breadcrumbs = calculateBreadcrumbs(location.pathname, segmentAlias);

  return (
    <DashboardLayout
      slots={{
        toolbarAccount: ToolbarAccount,
      }}
    >
      <PageContainer title={title} breadcrumbs={breadcrumbs}>
        <Outlet />
      </PageContainer>
    </DashboardLayout>
  );
};

export const RootRoute = () => {
  const theme = useTheme();

  const NAVIGATION = createNavigation(import.meta.env.DEV);

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
