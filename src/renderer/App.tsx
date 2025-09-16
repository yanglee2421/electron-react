import { RouterUI } from "./router/RouterUI";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React from "react";
import "dayjs/locale/zh";
// import "dayjs/locale/en";
import { QueryProvider } from "./components/query";
import { db } from "./lib/db";
import type { Log } from "./lib/db";

const mediaQuery = matchMedia("(prefers-color-scheme: dark)");
const lightTheme = createTheme({
  palette: {},
  components: {
    MuiAlert: {
      defaultProps: { variant: "filled" },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
  components: {
    MuiAlert: {
      defaultProps: { variant: "filled" },
    },
  },
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
    () => false,
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

const useLog = () => {
  React.useEffect(() => {
    const listener = (data: Log) => {
      db.log.add({ type: data.type, message: data.message, date: data.date });
    };

    const unsubscribe = window.electronAPI.subscribeLog(listener);

    return () => {
      unsubscribe();
    };
  }, []);
};

export const App = () => {
  useLog();

  return (
    <QueryProvider>
      <MuiProvider>
        <RouterUI />
      </MuiProvider>
    </QueryProvider>
  );
};
