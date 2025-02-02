import React from "react";

export const useSize = (ref: React.RefObject<HTMLElement | null>) => {
  const [size, setSize] = React.useState<ResizeObserverEntry | null>(null);

  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const div = ref.current;
    if (!div) return;

    const observer = new ResizeObserver(([entry]) => {
      startTransition(() => {
        setSize(entry);
      });
    });
    observer.observe(div);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return [size, isPending] as const;
};
