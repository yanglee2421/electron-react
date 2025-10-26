import React from "react";

export const useOnlineStatus = () =>
  React.useSyncExternalStore(
    (onStateChange) => {
      window.addEventListener("online", onStateChange);
      window.addEventListener("offline", onStateChange);

      return () => {
        window.removeEventListener("online", onStateChange);
        window.removeEventListener("offline", onStateChange);
      };
    },
    () => navigator.onLine,
    () => false,
  );
