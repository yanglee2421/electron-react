import {
  ThemeProvider,
  CssBaseline,
  GlobalStyles,
  createTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/zh";
import "dayjs/locale/en";
import React from "react";
import { useIsDark } from "@/hooks/useIsDark";
import { useLocalStore } from "@/hooks/useLocalStore";

const spacing = (abs: number) => `${abs * 0.25}rem`;

const lightTheme = createTheme({ spacing });

const darkTheme = createTheme({
  palette: { mode: "dark" },
  spacing,
});

const enableDarkMode = (mode: string, isDark: boolean) => {
  switch (mode) {
    case "light":
      return false;
    case "dark":
      return true;
    case "system":
    default:
      return isDark;
  }
};

type Props = React.PropsWithChildren;

export const MuiProvider = (props: Props) => {
  const isDark = useIsDark();
  const mode = useLocalStore((state) => state.mode);

  const theme = enableDarkMode(mode, isDark) ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh">
        {props.children}
      </LocalizationProvider>
      <CssBaseline />
      <GlobalStyles
        styles={{
          "#nprogress": {
            position: "fixed",
            top: 0,
            inlineSize: "100dvw",

            zIndex: theme.zIndex.drawer + 1,
          },
          "#nprogress .bar": {
            backgroundColor: theme.palette.primary.main,
            blockSize: theme.spacing(1),
          },
        }}
      />
    </ThemeProvider>
  );
};
