import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Printer } from "./printer";

export const registerIPCHandlers = (printer: Printer) => {
  ipcHandle("printer/chr501", (_, id: string) => {
    return printer.getDataForCHR501(id);
  });

  return () => {
    ipcRemoveHandle("printer/chr501");
  };
};
