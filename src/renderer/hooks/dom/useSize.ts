import React from "react";

export const useSize = (ref: React.RefObject<HTMLElement | null>) => {
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);

  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const div = ref.current;
    if (!div) return;

    const observer = new ResizeObserver(
      ([{ contentBoxSize: [{ inlineSize, blockSize }] }]) => {
        startTransition(() => {
          setWidth(inlineSize);
          setHeight(blockSize);
        });
      },
    );
    observer.observe(div);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return [width, height, isPending] as const;
};
