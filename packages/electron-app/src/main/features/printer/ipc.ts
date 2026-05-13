import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Printer } from "./printer";

export const registerIPCHandlers = (printer: Printer) => {
  ipcHandle("printer/chr501", (_, id: string) => {
    return printer.getDataForCHR501(id);
  });
  ipcHandle("printer/chr502", () => {
    return printer.getDataForCHR502();
  });
  ipcHandle("printer/print", () => {
    return printer.print();
  });

  return () => {
    ipcRemoveHandle("printer/chr501");
    ipcRemoveHandle("printer/chr502");
    ipcRemoveHandle("printer/print");
  };
};
