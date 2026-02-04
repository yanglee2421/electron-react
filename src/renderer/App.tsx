import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { db } from "./lib/db";
import { RouterUI } from "./router/RouterUI";
import { useIsDark } from "./hooks/dom/useIsDark";
import { QueryProvider } from "./components/query";
import type { Log } from "./lib/db";

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

    return () => unsubscribe();
  }, []);
};

const AppRouter = () => {
  return <RouterUI />;
};

export const App = () => {
  useLog();

  return (
    <QueryProvider>
      <MuiProvider>
        <AppRouter />
      </MuiProvider>
    </QueryProvider>
  );
};
