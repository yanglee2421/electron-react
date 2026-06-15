import { container } from "#main/features";
import { calculateErrorMessage } from "#shared/functions/error";
import { promiseTry } from "@yotulee/run";
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

type IPCArgs<TKey extends keyof IPCContract> = IPCContract[TKey] extends {
  args: infer A;
}
  ? A extends unknown[]
    ? [Electron.IpcMainInvokeEvent, ...A]
    : [Electron.IpcMainInvokeEvent]
  : never;

export const ipcHandle = <TKey extends keyof IPCContract>(
  key: TKey,
  listener: HandlerFn<TKey>,
) => {
  return ipcMain.handle(key, async (...args) => {
    const { logger } = container.cradle;

    try {
      const $args = args as IPCArgs<TKey>;
      const result = await promiseTry(listener, ...$args);

      return result;
    } catch (error) {
      if (error instanceof Error) {
        void logger.error({
          title: error.message,
          message: error.stack,
        });
      }

      throw calculateErrorMessage(error);
    }
  });
};

export const ipcRemoveHandle = <TKey extends keyof IPCContract>(key: TKey) => {
  return ipcMain.removeHandler(key);
};
