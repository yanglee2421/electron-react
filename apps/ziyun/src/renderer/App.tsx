import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React from "react";
import { ToastContainer } from "react-toastify";
import { QueryProvider } from "./components/query";
import { useColorScheme } from "./hooks/dom/useColorScheme";
import { AppRouter } from "./router";

const calculateTheme = (isDark: boolean) => {
  if (isDark) {
    const darkTheme = createTheme({
      palette: {
        mode: "dark",
      },
      components: {
        MuiAlert: {
          defaultProps: {
            variant: "outlined",
            severity: "error",
          },
        },
      },
    });

    return darkTheme;
  }

  const lightTheme = createTheme({
    palette: {
      mode: "light",
    },
    components: {
      MuiAlert: {
        defaultProps: {
          variant: "outlined",
          severity: "error",
        },
      },
    },
  });

  return lightTheme;
};

const MuiProvider = (props: React.PropsWithChildren) => {
  const isDark = useColorScheme();

  const theme = calculateTheme(isDark);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer theme={isDark ? "dark" : "light"} />
      <GlobalStyles
        styles={{ html: { colorScheme: isDark ? "dark" : "light" } }}
      />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh">
        {props.children}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export const App = () => {
  return (
    <QueryProvider>
      <MuiProvider>
        <AppRouter />
      </MuiProvider>
    </QueryProvider>
  );
};
