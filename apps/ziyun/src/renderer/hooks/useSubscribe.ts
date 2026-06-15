import React from "react";

export const useSubscribe = <TPayload>(
  event: string,
  callbackFn: (payload: TPayload) => void,
) => {
  const listener = React.useEffectEvent((payload: TPayload) => {
    callbackFn(payload);
  });

  React.useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on(event, (_, payload) => {
      listener(payload);
    });

    return () => {
      unsubscribe();
    };
  }, [event]);
};
