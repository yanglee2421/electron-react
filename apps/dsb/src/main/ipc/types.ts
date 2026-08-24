import type { IPC as KVIPC } from "#main/ioc/kv/types";
import type { IpcMainInvokeEvent } from "electron";

export interface IPC extends KVIPC {
  test: {
    args: [];
    return: void;
  };
}

export type IPCHandler<TKey extends keyof IPC> = IPC[TKey] extends {
  args: infer TArgs;
  return: infer TReturn;
}
  ? (
      ...args: TArgs extends unknown[]
        ? [IpcMainInvokeEvent, ...TArgs]
        : [IpcMainInvokeEvent]
    ) => TReturn | Promise<TReturn>
  : never;
