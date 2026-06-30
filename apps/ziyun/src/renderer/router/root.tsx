import { useLogUpdate } from "#renderer/api/logger";
import { useProfileStore } from "#renderer/hooks/stores/useProfileStore";
import { ipc } from "#renderer/lib/ipc";
import {
  CalendarMonthRounded,
  CalendarTodayRounded,
  HomeRounded,
  InfoRounded,
  MemoryRounded,
  PermMediaRounded,
  QrCodeRounded,
  QrCodeScannerRounded,
  ScienceRounded,
  SettingsRounded,
  SportsEsportsRounded,
  TodayRounded,
  TrainRounded,
  TuneRounded,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import type { Navigation } from "@toolpad/core";
import { DialogsProvider, NotificationsProvider } from "@toolpad/core";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import React from "react";
import {
  isRouteErrorResponse,
  Link,
  Outlet,
  ScrollRestoration,
  useNavigate,
  useRouteError,
} from "react-router";
import { NprogressBar } from "./nprogress";

const calcSegment = (...args: string[]) => {
  return args.join("/");
};

interface ErrorAlertContentProps {
  error: unknown;
}

const ErrorAlertContent = ({ error }: ErrorAlertContentProps) => {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <AlertTitle>{error.status}</AlertTitle>
        <Typography>{error.statusText}</Typography>
        <Link to="/">
          <Button startIcon={<HomeRounded />}>返回首页</Button>
        </Link>
      </>
    );
  }

  if (error instanceof Error) {
    return (
      <>
        <AlertTitle>错误</AlertTitle>
        <Typography>{error.message}</Typography>
        <Typography variant="body2">{error.stack}</Typography>
        <Link to="/">
          <Button startIcon={<HomeRounded />} color="error">
            返回首页
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <AlertTitle>错误</AlertTitle>
      <Typography>未知错误，请联系服务人员</Typography>
      <Link to="/">
        <Button startIcon={<HomeRounded />} color="error">
          返回首页
        </Button>
      </Link>
    </>
  );
};

export const RootErrorBoundary = () => {
  const error = useRouteError();

  return (
    <Box sx={{ padding: 6 }}>
      <Alert severity="error" variant="outlined">
        <ErrorAlertContent error={error} />
      </Alert>
    </Box>
  );
};

export const RootHydrateFallback = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <CircularProgress size={64} />
      <Typography variant="body2" color="textSecondary">
        正在加载配置
      </Typography>
    </Box>
  );
};

const useOpenURL = () => {
  const navigate = useNavigate();
  const handleSingleInstance = React.useEffectEvent((path: string) => {
    navigate(path);
  });

  React.useEffect(() => {
    const unsubscribe = ipc.on("open-url", (_, payload) => {
      const url = payload.url;

      if (URL.canParse(url)) {
        const path = new URL(url).pathname;

        handleSingleInstance(path);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
};

const useNavigation = () => {
  const showHxzyHmisMenu = useProfileStore((s) => s.showHxzyHmisMenu);
  const showJtvHmisMenu = useProfileStore((s) => s.showJtvHmisMenu);
  const showGuangzhoubeiHmisMenu = useProfileStore(
    (s) => s.showGuangzhoubeiHmisMenu,
  );
  const showGuangzhoujibaoduanHmisMenu = useProfileStore(
    (s) => s.showGuangzhoujibaoduanHmisMenu,
  );
  const showKhHmisMenu = useProfileStore((s) => s.showKhHmisMenu);
  const showPLCMenu = useProfileStore((s) => s.showPLCMenu);

  const NAVIGATION = React.useMemo(() => {
    const navMenus: Navigation = [];

    if (
      showHxzyHmisMenu ||
      showJtvHmisMenu ||
      showGuangzhoubeiHmisMenu ||
      showGuangzhoujibaoduanHmisMenu ||
      showKhHmisMenu
    ) {
      navMenus.push({
        kind: "header",
        title: "HMIS",
      });
    }

    if (showHxzyHmisMenu) {
      navMenus.push({
        title: "华兴致远",
        children: [
          {
            segment: calcSegment("hxzy"),
            title: "HMIS",
            icon: <QrCodeScannerRounded />,
          },
          {
            segment: calcSegment("hxzy", "verifies"),
            title: "日常校验",
            icon: <CalendarTodayRounded />,
          },
          {
            segment: calcSegment("hxzy", "setting"),
            title: "设置",
            icon: <TuneRounded />,
          },
        ],
      });
    }

    if (showJtvHmisMenu) {
      navMenus.push({
        title: "京天威",
        children: [
          {
            segment: calcSegment("jtv"),
            title: "HMIS",
            icon: <QrCodeScannerRounded />,
          },
          {
            segment: calcSegment("jtv", "setting"),
            title: "设置",
            icon: <TuneRounded />,
          },
        ],
      });
    }

    if (showGuangzhoubeiHmisMenu) {
      navMenus.push({
        title: "广州北",
        children: [
          {
            segment: calcSegment("jtv_guangzhoubei"),
            title: "HMIS",
            icon: <QrCodeScannerRounded />,
          },
          {
            segment: calcSegment("jtv_guangzhoubei", "setting"),
            title: "设置",
            icon: <TuneRounded />,
          },
        ],
      });
    }

    if (showGuangzhoujibaoduanHmisMenu) {
      navMenus.push({
        title: "广州机保段",
        children: [
          {
            segment: calcSegment("jtv_guangzhoujibaoduan"),
            title: "HMIS",
            icon: <QrCodeScannerRounded />,
          },
          {
            segment: calcSegment("jtv_guangzhoujibaoduan", "setting"),
            title: "设置",
            icon: <TuneRounded />,
          },
        ],
      });
    }

    if (showKhHmisMenu) {
      navMenus.push({
        title: "康华",
        children: [
          {
            segment: calcSegment("kh"),
            title: "HMIS",
            icon: <QrCodeScannerRounded />,
          },
          {
            segment: calcSegment("kh", "detections"),
            title: "现车作业",
            icon: <TrainRounded />,
          },
          {
            segment: calcSegment("kh", "verify"),
            title: "日常校验",
            icon: <TodayRounded />,
          },
          {
            segment: calcSegment("kh", "quartor"),
            title: "季度校验",
            icon: <CalendarMonthRounded />,
          },
          {
            segment: calcSegment("kh", "annual"),
            title: "年度校验",
            icon: <CalendarTodayRounded />,
          },
          {
            segment: calcSegment("kh", "setting"),
            title: "设置",
            icon: <TuneRounded />,
          },
        ],
      });
    }

    if (
      showHxzyHmisMenu ||
      showJtvHmisMenu ||
      showGuangzhoubeiHmisMenu ||
      showGuangzhoujibaoduanHmisMenu ||
      showKhHmisMenu
    ) {
      navMenus.push({
        kind: "divider",
      });
    }

    navMenus.push(
      {
        kind: "header",
        title: "常规12通道软件",
      },
      {
        segment: calcSegment("detection"),
        title: "现车作业",
        icon: <TrainRounded />,
      },
      {
        segment: calcSegment("verify"),
        title: "日常校验",
        icon: <TodayRounded />,
      },
      {
        segment: calcSegment("quartors"),
        title: "季度校验",
        icon: <CalendarMonthRounded />,
      },
      {
        segment: calcSegment("anniversary"),
        title: "年度校验",
        icon: <CalendarTodayRounded />,
      },
      {
        kind: "divider",
      },
      {
        kind: "header",
        title: "QT版软件",
      },
      {
        segment: calcSegment("qt", "anniversary"),
        title: "anniversary",
        icon: <QrCodeRounded />,
      },
    );

    navMenus.push(
      { kind: "divider" },
      {
        kind: "header",
        title: "其它",
      },
      {
        segment: calcSegment("log"),
        title: "日志",
        icon: <InfoRounded />,
      },
      {
        segment: calcSegment("settings"),
        title: "设置",
        icon: <SettingsRounded />,
      },
    );

    if (showPLCMenu) {
      navMenus.push({
        segment: calcSegment("plc"),
        title: "PLC",
        icon: <MemoryRounded />,
      });
    }

    if (import.meta.env.DEV) {
      navMenus.push(
        {
          segment: calcSegment("md5_backup_image"),
          title: "图片备份",
          icon: <PermMediaRounded />,
        },
        {
          segment: calcSegment("lab"),
          title: "实验室",
          icon: <ScienceRounded />,
        },
        {
          segment: calcSegment("minesweeper"),
          title: "Minesweeper",
          icon: <SportsEsportsRounded />,
        },
        {
          segment: calcSegment("qrcode"),
          title: "QRCode",
          icon: <QrCodeRounded />,
        },
      );
    }

    return navMenus;
  }, [
    showHxzyHmisMenu,
    showJtvHmisMenu,
    showGuangzhoubeiHmisMenu,
    showGuangzhoujibaoduanHmisMenu,
    showKhHmisMenu,
    showPLCMenu,
  ]);

  return NAVIGATION;
};

export const RootRoute = () => {
  const theme = useTheme();
  const NAVIGATION = useNavigation();

  useLogUpdate();
  useOpenURL();

  return (
    <ReactRouterAppProvider
      navigation={NAVIGATION}
      branding={{ title: "武铁紫云接口面板" }}
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
