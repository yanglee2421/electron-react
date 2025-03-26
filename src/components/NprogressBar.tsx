import React from "react";
import NProgress from "nprogress";
import { useNavigation } from "react-router";

export const NprogressBar = () => {
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

  return null;
};
