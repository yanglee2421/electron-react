import { networkInterfaces } from "node:os";
import { promisify } from "node:util";
import { exec, execFile } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { BrowserWindow } from "electron";
import * as channel from "./channel";
import type { Corporation } from "@/api/database_types";
import type { Log } from "@/hooks/useIndexedStore";

export const execAsync = promisify(exec);
export const execFileAsync = promisify(execFile);

export const log = (message: string, type = "info") => {
  const data: Log = {
    id: randomUUID(),
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

export const getCpuSerial = async () => {
  const data = await execAsync(
    "Get-CimInstance -ClassName Win32_Processor | Select-Object ProcessorId",
    { shell: "powershell" }
  );

  if (data.stderr) {
    throw data.stderr;
  }

  return data.stdout;
};

export const getMotherboardSerial = async () => {
  const data = await execAsync(
    "Get-WmiObject win32_baseboard | Select-Object SerialNumber",
    { shell: "powershell" }
  );

  if (data.stderr) {
    throw data.stderr;
  }

  return data.stdout;
};

const winword_paths = [
  "C:\\Program Files (x86)\\Microsoft Office\\Office16\\WINWORD.EXE",
  "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
  "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
  "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
];

export const verifyPath = async (path: string) => {
  await access(path, constants.R_OK);
  return path;
};

export const runWinword = async (data: string) => {
  const winwords = await Promise.allSettled(
    winword_paths.map((path) => verifyPath(path))
  );

  const winword = winwords.find(
    (result) => result.status === "fulfilled"
  )?.value;

  if (!winword) {
    throw "Find winword failed";
  }

  const cp = await execFileAsync(
    winword,
    [
      data,
      "/save",
      "/q",
      "/pxslt",
      "/a",
      "/mFilePrint",
      "/mFileCloseOrExit",
      "/n",
      "/w",
      "/x",
    ],
    { windowsVerbatimArguments: false, shell: false }
  );
  return cp;
};

export const getDataFromAccessDatabase = async <T = unknown>(params: {
  driverPath: string;
  databasePath: string;
  sql: string;
}) => {
  const data = await execFileAsync(params.driverPath, [
    "GetDataFromAccessDatabase",
    params.databasePath,
    params.sql,
  ]);

  if (data.stderr) {
    throw data.stderr;
  }

  return JSON.parse(data.stdout) as T[];
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

      return !i.internal;
    })?.address;

  return IP || "";
};

type GetDeviceNoParams = {
  driverPath: string;
  databasePath: string;
};

export const getDeviceNo = async (params: GetDeviceNoParams) => {
  const [corporation] = await getDataFromAccessDatabase<Corporation>({
    driverPath: params.driverPath,
    databasePath: params.databasePath,
    sql: "SELECT TOP 1 * FROM corporation",
  });

  if (!corporation) {
    throw "未找到公司信息";
  }

  return corporation.DeviceNO;
};

export const withLog = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TCallback extends (...args: any[]) => Promise<unknown>
>(
  callback: TCallback
): TCallback => {
  const fn = async (...args: Parameters<TCallback>) => {
    try {
      return await callback(...args);
    } catch (error) {
      const message = errorToMessage(error);
      log(message, "error");
      // Throw message instead of error to avoid electron issue #24427
      throw message;
    }
  };

  return fn as TCallback;
};
