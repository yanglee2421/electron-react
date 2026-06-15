import React from "react";

export const useVisibilityChange = (callbackFn: () => void) => {
  const listener = React.useEffectEvent(() => {
    callbackFn();
  });

  React.useEffect(() => {
    const controller = new AbortController();

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState !== "visible") return;
        listener();
      },
      controller,
    );

    return () => {
      controller.abort();
    };
  }, []);
};
