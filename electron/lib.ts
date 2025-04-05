import { networkInterfaces } from "node:os";
import { promisify } from "node:util";
import { exec, execFile } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { BrowserWindow } from "electron";
import * as channel from "./channel";
import dayjs from "dayjs";
import type {
  Corporation,
  Detection,
  DetectionData,
} from "#/electron/database_types";
import type { Log } from "@/hooks/useIndexedStore";

export const DATE_FORMAT_DATABASE = "YYYY/MM/DD HH:mm:ss";
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

type WithLogFn<TArgs extends unknown[], TReturn = void> = (
  ...args: TArgs
) => Promise<TReturn>;

export const withLog = <TArgs extends unknown[], TReturn = void>(
  fn: WithLogFn<TArgs, TReturn>
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

type GetCorporationParams = {
  driverPath: string;
  databasePath: string;
};

export const getCorporation = async (params: GetCorporationParams) => {
  const [corporation] = await getDataFromAccessDatabase<Corporation>({
    driverPath: params.driverPath,
    databasePath: params.databasePath,
    sql: "SELECT TOP 1 * FROM corporation",
  });

  if (!corporation) {
    throw "未找到公司信息";
  }

  return corporation;
};

export const getDetectionByZH = async (params: {
  driverPath: string;
  databasePath: string;
  zh: string;
  startDate: string;
  endDate: string;
}) => {
  const startDate = dayjs(params.startDate).format(DATE_FORMAT_DATABASE);
  const endDate = dayjs(params.endDate).format(DATE_FORMAT_DATABASE);

  const [detection] = await getDataFromAccessDatabase<Detection>({
    driverPath: params.driverPath,
    databasePath: params.databasePath,
    sql: `SELECT TOP 1 * FROM detections WHERE szIDsWheel ='${params.zh}' AND tmnow BETWEEN #${startDate}# AND #${endDate}# ORDER BY tmnow DESC`,
  });

  if (!detection) {
    throw `未找到轴号[${params.zh}]的detections记录`;
  }

  return detection;
};

export const getDetectionDatasByOPID = async (params: {
  driverPath: string;
  databasePath: string;
  opid: string;
}) => {
  const detectionDatas = await getDataFromAccessDatabase<DetectionData>({
    driverPath: params.driverPath,
    databasePath: params.databasePath,
    sql: `SELECT * FROM detections_data WHERE opid ='${params.opid}'`,
  });

  return detectionDatas;
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
