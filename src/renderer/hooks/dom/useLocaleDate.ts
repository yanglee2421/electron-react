import React from "react";

export const useLocaleDate = (locales?: Intl.LocalesArgument) => {
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
      return new Date().toLocaleDateString(locales, {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "numeric",
      });
    },
  );
};
