import React from "react";

export const useWindowFocus = (callbackFn: () => void) => {
  const handleFocus = React.useEffectEvent(() => {
    callbackFn();
  });

  React.useEffect(() => {
    const unsubscribeFocus = window.electron.ipcRenderer.on(
      "windowFocus",
      handleFocus,
    );
    const unsubscribeBlur = window.electron.ipcRenderer.on(
      "windowBlur",
      handleFocus,
    );

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, []);
};
