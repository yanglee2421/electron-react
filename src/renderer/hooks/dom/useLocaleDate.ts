import React from "react";
import { onAnimationFrame } from "#renderer/lib/utils";

export const useLocaleDate = (locales?: Intl.LocalesArgument) => {
  return React.useSyncExternalStore(onAnimationFrame, () =>
    getDateString(locales),
  );
};

const getDateString = (locales?: Intl.LocalesArgument) => {
  return new Date().toLocaleDateString(locales, {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "numeric",
  });
};
