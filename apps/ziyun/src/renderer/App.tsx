import {
  CssBaseline,
  GlobalStyles,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import React from "react";
import { QueryProvider } from "./components/query";
import { useColorScheme } from "./hooks/dom/useColorScheme";
import { AppRouter } from "./router";

const calculateTheme = (isDark: boolean) => {
  if (isDark) {
    const darkTheme = createTheme({
      palette: {
        mode: "dark",
      },
    });

    return darkTheme;
  }

  const lightTheme = createTheme({
    palette: {
      mode: "light",
    },
  });

  return lightTheme;
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
      <GlobalStyles
        styles={{
          html: { colorScheme: isDark ? "dark" : "light" },
        }}
      />
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