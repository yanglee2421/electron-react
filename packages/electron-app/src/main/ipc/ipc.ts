import { ipcMain } from "electron";
import type { IPCContract } from "./types";

type HandlerFn<K extends keyof IPCContract> = IPCContract[K] extends {
  args: infer A;
  return: infer R;
}
  ? (
      ...args: A extends unknown[]
        ? [Electron.IpcMainInvokeEvent, ...A]
        : [Electron.IpcMainInvokeEvent]
    ) => R | Promise<R>
  : never;

export const ipcHandle = <TKey extends keyof IPCContract>(
  key: TKey,
  listener: HandlerFn<TKey>,
) => {
  return ipcMain.handle(key, listener);
};

export const ipcRemoveHandle = <TKey extends keyof IPCContract>(key: TKey) => {
  return ipcMain.removeHandler(key);
};
