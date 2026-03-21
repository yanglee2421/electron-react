import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React from "react";
import { QueryProvider } from "./components/query";
import { useColorScheme } from "./hooks/dom/useColorScheme";
import { useSubscribe } from "./hooks/useSubscribe";
import type { Log } from "./lib/db";
import { db } from "./lib/db";
import { AppRouter } from "./router";

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
  useSubscribe("LOG", (data: Log) => {
    void db.log.add({
      type: data.type,
      message: data.message,
      date: data.date,
    });
  });
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
