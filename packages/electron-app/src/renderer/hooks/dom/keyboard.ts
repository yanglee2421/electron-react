import React from "react";

export const useVisualViewportHeight = () => {
  return React.useSyncExternalStore(
    (onStateChange) => {
      window.visualViewport?.addEventListener("resize", onStateChange);
      return () => {
        window.visualViewport?.removeEventListener("resize", onStateChange);
      };
    },
    () => window.visualViewport?.height || 0,
  );
};

export const useWindowInnerHeight = () => {
  return React.useSyncExternalStore(
    (onStateChange) => {
      window.addEventListener("resize", onStateChange);
      return () => {
        window.removeEventListener("resize", onStateChange);
      };
    },
    () => window.innerHeight,
  );
};

export const useKeyboardHeight = () => {
  const visualViewportHeight = useVisualViewportHeight();
  const windowInnerHeight = useWindowInnerHeight();
  const keyboardHeight = windowInnerHeight - visualViewportHeight;

  return keyboardHeight;
};
