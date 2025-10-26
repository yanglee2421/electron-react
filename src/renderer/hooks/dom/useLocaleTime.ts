import { onAnimationFrame } from "@/lib/utils";
import React from "react";

export const useLocaleTime = (locales?: Intl.LocalesArgument) => {
  return React.useSyncExternalStore(
    onAnimationFrame,
    () => getTimeString(locales),
    () => getTimeString(locales),
  );
};

const getTimeString = (locales?: Intl.LocalesArgument) => {
  return new Date().toLocaleTimeString(locales, {
    timeStyle: "short",
    hour12: false,
  });
};
