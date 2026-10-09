import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Cmd } from "./cmd";

export const registerIPCHandlers = (cmd: Cmd) => {
  ipcHandle("WIN/autoInputToVC", (_, params) => {
    return cmd.autoInputToVCNaive(params);
  });
  ipcHandle("WIN/isRunAsAdmin", async () => cmd.isRunAsAdmin());
  ipcHandle("CMD/open", () => cmd.openDevice());
  ipcHandle("CMD/close", () => cmd.closeDevice());
  ipcHandle("CMD/set-db", (_, l, r) => cmd.itsSetDB(l, r));

  return () => {
    ipcRemoveHandle("WIN/autoInputToVC");
    ipcRemoveHandle("WIN/isRunAsAdmin");
    ipcRemoveHandle("CMD/close");
    ipcRemoveHandle("CMD/open");
    ipcRemoveHandle("CMD/set-db");
  };
};
