import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Cmd } from "./cmd";

export const registerIPCHandlers = (cmd: Cmd) => {
  ipcHandle("WIN/autoInputToVC", (_, params) => {
    return cmd.autoInputToVCNaive(params);
  });
  ipcHandle("WIN/isRunAsAdmin", async () => cmd.isRunAsAdmin());

  return () => {
    ipcRemoveHandle("WIN/autoInputToVC");
    ipcRemoveHandle("WIN/isRunAsAdmin");
  };
};
