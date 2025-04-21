import { networkInterfaces } from "node:os";
import { BrowserWindow } from "electron";
import * as channel from "./channel";
import type { Log } from "#/src/lib/db";

export const log = (message: string, type = "info") => {
  const data: Log = {
    id: 0,
    date: new Date().toISOString(),
    message,
    type,
  };

  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send(channel.log, data);
  });
};

export const errorToMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return String(error);
};

type WithLogFn<TArgs extends unknown[], TReturn = void> = (
  ...args: TArgs
) => Promise<TReturn>;

export const withLog = <TArgs extends unknown[], TReturn = void>(
  fn: WithLogFn<TArgs, TReturn>,
): WithLogFn<TArgs, TReturn> => {
  const fnWithLog = async (...args: TArgs) => {
    try {
      // Ensure an error is thrown when the promise is rejected
      return await fn(...args);
    } catch (error) {
      console.error(error);
      // Log the error message
      const message = errorToMessage(error);
      log(message, "error");
      // Throw message instead of error to avoid electron issue #24427
      throw message;
    }
  };

  return fnWithLog;
};

export const getIP = () => {
  const interfaces = networkInterfaces();
  const IP = Object.values(interfaces)
    .flat()
    .find((i) => {
      if (!i) return false;

      if (i.family !== "IPv4") {
        return false;
      }

      if (i.address === "192.168.1.100") {
        return false;
      }

      return !i.internal;
    })?.address;
  return IP || "";
};

export const getDirection = (nBoard: number) => {
  //board(板卡)：0.左 1.右
  switch (nBoard) {
    case 1:
      return "右";
    case 0:
      return "左";
    default:
      return "";
  }
};

export const getPlace = (nChannel: number) => {
  //channel：0.穿透 1~2.轮座 3~8.轴颈
  switch (nChannel) {
    case 0:
      return "穿透";
    case 1:
    case 2:
      return "轮座";
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      return "轴颈";
    default:
      return "车轴";
  }
};

export const getSerialFromStdout = (stdout: string) => {
  return stdout.trim().split("\n").at(-1) || "";
};

export const createEmit = <TData = void>(channel: string) => {
  return (data: TData) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(channel, data);
    });
  };
};
