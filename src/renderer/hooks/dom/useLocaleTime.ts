import React from "react";

export const useLocaleTime = (locales?: Intl.LocalesArgument) => {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      let timer = 0;

      const handleFrame = () => {
        timer = requestAnimationFrame(handleFrame);
        onStoreChange();
      };

      handleFrame();

      return () => {
        cancelAnimationFrame(timer);
      };
    },
    () => {
      return new Date().toLocaleTimeString(locales, {
        hour12: false,
        timeStyle: "long",
      });
    },
  );
};
