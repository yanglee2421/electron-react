import { ipc } from "#renderer/lib/ipc";
import { useMutation } from "@tanstack/react-query";

export const useCMDOpen = () => {
  return useMutation({
    mutationFn: () => ipc.invoke("CMD/open"),
  });
};

export const useCMDClose = () => {
  return useMutation({
    mutationFn: () => ipc.invoke("CMD/close"),
  });
};
