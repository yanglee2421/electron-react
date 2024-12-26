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
import { useParams } from "react-router";
import { useIsDark } from "@/hooks/useIsDark";

const spacing = (abs: number) => `${abs * 0.25}rem`;

const lightTheme = createTheme({ spacing });

const darkTheme = createTheme({
  palette: { mode: "dark" },
  spacing,
});

type Props = React.PropsWithChildren;

export const MuiProvider = (props: Props) => {
  const params = useParams();
  const isDark = useIsDark();

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale={params.lang}
      >
        {props.children}
      </LocalizationProvider>
      <CssBaseline />
      <GlobalStyles styles={{}} />
    </ThemeProvider>
  );
};
