import { GlobalStyles, useTheme } from "@mui/material";
import React from "react";
import { useNavigation } from "react-router";
import NProgress from "nprogress";

const useNprogress = () => {
  const navigation = useNavigation();

  React.useEffect(() => {
    switch (navigation.state) {
      case "submitting":
      case "loading":
        NProgress.start();
        break;
      case "idle":
      default:
        NProgress.done();
    }
  }, [navigation.state]);
};

export const NprogressBar = () => {
  const theme = useTheme();
  useNprogress();

  return (
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
          blockSize: 2,
        },
      }}
    />
  );
};
