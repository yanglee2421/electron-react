import type * as mdb from "#main/modules/mdb";
import type * as guangzhoubei from "#main/shared/factories/hmis/guangzhoubei";
import type * as guangzhoujibaoduan from "#main/shared/factories/hmis/guangzhoujibaoduan";
import type * as hxzy from "#main/shared/factories/hmis/hxzy";
import type * as jtv from "#main/shared/factories/hmis/jtv";
import type * as kh from "#main/shared/factories/hmis/kh_hmis";
import type * as xuzhoubei from "#main/shared/factories/hmis/xuzhoubei";
import type * as logger from "#main/shared/factories/Logger";
import { calculateErrorMessage } from "#shared/functions/error";
import { promiseTry } from "@yotulee/run";
import { ipcMain } from "electron";

export interface IpcContract
  extends hxzy.Ipc,
    kh.Ipc,
    jtv.Ipc,
    guangzhoubei.Ipc,
    guangzhoujibaoduan.IpcContract,
    xuzhoubei.Ipc,
    mdb.IpcContract {
  "APP/OPEN_AT_LOGIN": {
    args: [boolean?];
    return: boolean;
  };
  "APP/OPEN_DEV_TOOLS": {
    args: [];
    return: void;
  };
  "APP/OPEN_PATH": {
    args: [string];
    return: string;
  };
  "APP/MOBILE_MODE": {
    args: [boolean];
    return: boolean;
  };
  "APP/SELECT_DIRECTORY": {
    args: [];
    return: string[];
  };
  "APP/SELECT_FILE": {
    args: [Electron.FileFilter[]];
    return: string[];
  };
  "APP/SHOW_OPEN_DIALOG": {
    args: [Electron.OpenDialogOptions];
    return: string[];
  };
}

export interface SQLiteGetParams {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
}

export interface InsertRecordParams {
  DH: string;
  ZH: string;
  CZZZDW: string;
  CZZZRQ: string;
}

type HandlerFn<K extends keyof IpcContract> = IpcContract[K] extends {
  args: infer A;
  return: infer R;
}
  ? (
      ...args: A extends unknown[]
        ? [Electron.IpcMainInvokeEvent, ...A]
        : [Electron.IpcMainInvokeEvent]
    ) => Promise<Awaited<R>>
  : never;

type IPCArgs<TKey extends keyof IpcContract> = IpcContract[TKey] extends {
  args: infer A;
}
  ? A extends unknown[]
    ? [Electron.IpcMainInvokeEvent, ...A]
    : [Electron.IpcMainInvokeEvent]
  : never;

export interface Version {
  version: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  v8Version: string;
}

export type IpcHandle = <TKey extends keyof IpcContract>(
  key: TKey,
  listener: HandlerFn<TKey>,
) => void;

export class IPCHandle {
  private logger: logger.Logger;

  constructor(logger: logger.Logger) {
    this.logger = logger;
  }

  handle<TKey extends keyof IpcContract>(key: TKey, listener: HandlerFn<TKey>) {
    return ipcMain.handle(key, async (...args) => {
      try {
        // Must await the result to catch the error,
        // otherwise the error will be unhandled and crash the app
        const $args = args as IPCArgs<TKey>;
        const result = await promiseTry(listener, ...$args);

        return result;
      } catch (error) {
        if (error instanceof Error) {
          void this.logger.error({
            title: error.message,
            message: error.stack,
          });
        }

        throw calculateErrorMessage(error);
      }
    });
  }
}
