import { HomeOutlined } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  isRouteErrorResponse,
  Link,
  useNavigate,
  useRouteError,
} from "react-router";

import { useLogUpdate } from "#renderer/api/logger";

import { ipc } from "#renderer/lib/ipc";
import {
  CalendarMonthOutlined,
  CalendarTodayOutlined,
  CalendarViewMonthOutlined,
  CodeOutlined,
  InfoOutlined,
  Memory,
  PermMediaOutlined,
  QrCodeOutlined,
  QrCodeScannerOutlined,
  ScienceOutlined,
  SettingsOutlined,
  SportsEsportsOutlined,
  TrainOutlined,
  TuneOutlined,
  VpnKeyOutlined,
} from "@mui/icons-material";
import { useTheme } from "@mui/material";
import type { Navigation } from "@toolpad/core";
import { DialogsProvider, NotificationsProvider } from "@toolpad/core";
import { ReactRouterAppProvider } from "@toolpad/core/react-router";
import React from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { NprogressBar } from "./nprogress";

const calculateSegment = (...args: string[]) => {
  return args.join("/");
};

const createNavigation = (shouldAdd: boolean): Navigation => {
  const result: Navigation = [];

  result.push(
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
      title: "广州北",
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
      title: "广州机保段",
      children: [
        {
          segment: calculateSegment("jtv_guangzhoujibaoduan"),
          title: "HMIS",
          icon: <QrCodeScannerOutlined />,
        },
        {
          segment: calculateSegment("jtv_guangzhoujibaoduan", "setting"),
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
          segment: calculateSegment("kh", "verify"),
          title: "日常校验",
          icon: <CalendarTodayOutlined />,
        },
        {
          segment: calculateSegment("kh", "quartor"),
          title: "季度校验",
          icon: <CalendarMonthOutlined />,
        },
        {
          segment: calculateSegment("kh", "annual"),
          title: "年度校验",
          icon: <CalendarViewMonthOutlined />,
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
  );

  result.push(
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
      segment: calculateSegment("anniversary"),
      title: "年度校验",
      icon: <CalendarMonthOutlined />,
    },
    {
      kind: "divider",
    },
  );

  result.push(
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
      segment: calculateSegment("plc"),
      title: "PLC",
      icon: <Memory />,
    },
  );

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
    );
  }

  return result;
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
          <Button startIcon={<HomeOutlined />}>返回首页</Button>
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
          <Button startIcon={<HomeOutlined />} color="error">
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
        <Button startIcon={<HomeOutlined />} color="error">
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
      }}
    >
      <CircularProgress size={64} />
    </Box>
  );
};

export const RootRoute = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const handleSingleInstance = React.useEffectEvent(() => {
    navigate("/settings");
  });

  useLogUpdate();

  const NAVIGATION = createNavigation(import.meta.env.DEV);

  React.useEffect(() => {
    const unsubscribe = ipc.on("secondInstance", () => {
      handleSingleInstance();
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
