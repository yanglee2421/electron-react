import { ipcMain } from "electron";
import type { IPC, IPCHandler } from "./types";

export const ipcHandle = <TKey extends keyof IPC>(
  channel: TKey,
  handle: IPCHandler<TKey>,
) => {
  return ipcMain.handle(channel, handle);
};

export const ipcRemoveHandle = <TKey extends keyof IPC>(channel: TKey) => {
  return ipcMain.removeHandler(channel);
};
