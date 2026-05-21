import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Printer } from "./printer";

export const registerIPCHandlers = (printer: Printer) => {
  ipcHandle("printer/chr501", (_, id: string) => {
    return printer.getDataForCHR501(id);
  });
  ipcHandle("printer/chr502", (_, payload) => {
    return printer.getDataForCHR502(payload.ids);
  });
  ipcHandle("printer/chr503", (_, id: string) => {
    return printer.getDataForCHR503(id);
  });
  ipcHandle('printer/chr53a',async(_,input)=>{
    return printer.getDataForCHR53A(input.ids)
  })
  ipcHandle("printer/print", () => {
    return printer.print();
  });

  return () => {
    ipcRemoveHandle("printer/chr501");
    ipcRemoveHandle("printer/chr502");
    ipcRemoveHandle("printer/chr503");
    ipcRemoveHandle('printer/chr53a')
    ipcRemoveHandle("printer/print");
  };
};
