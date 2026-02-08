import React from "react";
import { useVisibilityChange } from "./useVisibilityChange";
import { useWindowFocus } from "./useWindowFocus";

export const useAutoFocusInputRef = () => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const inputFocus = () => {
    inputRef.current?.focus();
  };

  useWindowFocus(inputFocus);
  useVisibilityChange(inputFocus);

  return inputRef;
};
