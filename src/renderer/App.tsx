import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { db } from "./lib/db";
import { AppRouter } from "./router";
import { useColorScheme } from "./hooks/dom/useColorScheme";
import { QueryProvider } from "./components/query";
import type { Log } from "./lib/db";

const calculateTheme = (isDark: boolean) => {
  if (isDark) {
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

    return darkTheme;
  }

  const lightTheme = createTheme({
    palette: {},
    components: {
      MuiAlert: {
        defaultProps: { variant: "filled" },
      },
    },
  });

  return lightTheme;
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

type MuiProviderProps = React.PropsWithChildren;

const MuiProvider = (props: MuiProviderProps) => {
  const isDark = useColorScheme();

  const theme = calculateTheme(isDark);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh">
        {props.children}
      </LocalizationProvider>
      <CssBaseline />
    </ThemeProvider>
  );
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
