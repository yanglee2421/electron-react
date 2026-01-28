import { onAnimationFrame } from "#renderer/lib/utils";
import React from "react";

export const useLocaleTime = (locales?: Intl.LocalesArgument) => {
  return React.useSyncExternalStore(onAnimationFrame, () =>
    getTimeString(locales),
  );
};

const getTimeString = (locales?: Intl.LocalesArgument) => {
  return new Date().toLocaleTimeString(locales, {
    hour12: false,
    timeStyle: "long",
  });
};
