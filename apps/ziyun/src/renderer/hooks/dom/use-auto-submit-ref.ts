import React from "react";

export const useAutoSubmitRef = (
  enabled: boolean,
  inputValue: string,
  debounceTime = 1000 * 2,
) => {
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!enabled) return;
    if (!inputValue) return;

    const timer = setTimeout(() => {
      formRef.current?.requestSubmit();
    }, debounceTime);

    return () => {
      clearTimeout(timer);
    };
  }, [enabled, inputValue]);

  return formRef;
};
