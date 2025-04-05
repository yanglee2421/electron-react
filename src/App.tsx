import { RouterUI } from "./router/RouterUI";
import { SnackbarProvider } from "notistack";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/constants";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/zh";
import "dayjs/locale/en";
import { Loading } from "@/components/Loading";
import { useLocalStore, useLocalStoreHasHydrated } from "@/hooks/useLocalStore";
import {
  useIndexedStore,
  useIndexedStoreHasHydrated,
} from "@/hooks/useIndexedStore";
import type { Log } from "@/hooks/useIndexedStore";

const mediaQuery = matchMedia("(prefers-color-scheme: dark)");
const spacing = (abs: number) => `${abs * 0.25}rem`;
const lightTheme = createTheme({ spacing });

const darkTheme = createTheme({
  palette: { mode: "dark" },
  spacing,
});

const useIsDark = () =>
  React.useSyncExternalStore(
    (onStoreChange) => {
      mediaQuery.addEventListener("change", onStoreChange);

      return () => {
        mediaQuery.removeEventListener("change", onStoreChange);
      };
    },
    () => mediaQuery.matches,
    () => false
  );

type Props = React.PropsWithChildren;

const MuiProvider = (props: Props) => {
  const isDark = useIsDark();

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh">
        {props.children}
      </LocalizationProvider>
      <CssBaseline />
    </ThemeProvider>
  );
};

const QueryProvider = (props: React.PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
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

const useLog = () => {
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
};

export const App = () => {
  useNativeTheme();
  useAlwaysOnTop();
  useLog();

  const indexedHasHydrated = useIndexedStoreHasHydrated();
  const localHasHydrated = useLocalStoreHasHydrated();

  const renderRouter = () => {
    if (!indexedHasHydrated) {
      return <Loading />;
    }

    if (!localHasHydrated) {
      return <Loading />;
    }

    return <RouterUI />;
  };

  return (
    <QueryProvider>
      <MuiProvider>
        <SnackbarProvider
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          autoHideDuration={3000}
          maxSnack={3}
        >
          {renderRouter()}
        </SnackbarProvider>
      </MuiProvider>
    </QueryProvider>
  );
};
