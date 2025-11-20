import React from "react";

export const useIsDark = () => {
  const mediaQuery = matchMedia("(prefers-color-scheme: dark)");

  return React.useSyncExternalStore(
    (onStoreChange) => {
      mediaQuery.addEventListener("change", onStoreChange);

      return () => {
        mediaQuery.removeEventListener("change", onStoreChange);
      };
    },

    () => mediaQuery.matches,
  );
};
