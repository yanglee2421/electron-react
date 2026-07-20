import { useLogUpdate } from "#renderer/api/logger";
import { ipc } from "#renderer/lib/ipc";
import { HomeRounded } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { DialogsProvider } from "@toolpad/core";
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

export const RootRoute = () => {
  useLogUpdate();
  useOpenURL();

  return (
    <>
      <NprogressBar />
      <DialogsProvider>
        <Outlet />
      </DialogsProvider>
      <ScrollRestoration />
    </>
  );
};
