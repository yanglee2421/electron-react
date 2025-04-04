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

export const withLog = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TFn extends (...args: any[]) => Promise<unknown>
>(
  fn: TFn
): TFn => {
  const fnWithLog = async (...args: Parameters<TFn>) => {
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

  return fnWithLog as TFn;
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

export const DATE_FORMAT_DATABASE = "YYYY/MM/DD HH:mm:ss";
export const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0t/rJL4O1vKuG
Lo449OHDML49T4f8NzDK25wTRe0oqlKnxfpdQNjuLEGOSGH8B18AE9DGxpqsMt5d
Qo3ITY/RJaZ625R4s3+TfCteIG45AHk+NIQubqtWYyytMGnSkW02O7+Vi1VMZ7nz
Uh0t57rQWLqhPwY8z3R8afNABDQe5vuXVzIwoLYMXM/I2VEEsupgvyz+fKTerMzQ
Cdap9msvUBnyWaVaW8CKIp5Ac6s20oMtAF7NLN+dDpYp27DBBhN0ZsjpFE+Xzm/P
uTvSppB6Cvq5qiHvC6ROQknulSBuiRvxD0W6X71IPvr9fgMZy/fuJEEgVjF6y8WL
XZpH+Q+1AgMBAAECggEABGOmje3fQVH+iYEGd8gs1pCPwk3089GEWBz63rX3U2JF
pSkIEm1Bh5FgGzxTUut76XTRwI4w0gdfQr0b0/ZcTJxhPYEpS0Ay1EpzBDN98dj6
2OGuJzGNbEj23BL9sv1QvX04g0GR1gv75nbDWirTbP2GtOViuaXhQqdRHugrOuff
VSNJx/MBYKYPlrtLSZZ/coYZf5HCYbzjJHoKW/bZ+7R7kQx9cVqjWff9nnaWXU8q
2kixp8qG9NniJDnkI/VPgr2b9M98l02iAzrp60urxTkw14njXRrtoxTahrRqxaZX
/Gfk8WWH+jz/JgkuFrMxROssDQIFqKcsqoehCzYfoQKBgQDhn3zCU7fXtWN4YBbi
e8uEkpbBk/qKJzi/+HuGTmavb2oodxpGXX6XoM1F2Hlu0PG1x94pv9BRzYdmzG2c
/LOhMWKFvLQ6m8rE0RYGPqAJ+k1liAv6yPn8OoU89g594MLvelcpu9GGGd3VdM4k
NaTMMQjAz7VE8tfwpoMtvTxS4QKBgQDNDMgn2ogTwCBDntElA7tI2kCzhVNFS++W
F2p5sKV+du1rGn/nt7wJQEl4VpMhwdO/xcjWC3FC1/UIWKPbGUm58XT418nNh5QA
asRQ7P1jQRBHWxMhuMdazAzilTkUKz9gffnKzye/Ue1JjfEG1h2bQYUCmRIKYH7l
ydOd+33rVQKBgQDOH6eZ3WQKhKNwWNDvbsuavVVPWoK8bmKxNzCancvAINhqSY1O
laHOotCGK+OcsvTv7r3vhFasNUmrR74oetEcxYJNzf0Vwji4IJCvec058Ft/E5Bm
N+/yWABblivdIlbU8/7nmLgtfDonBcRCXmPFTFLD276uU/Gl4GndgpG24QKBgEuZ
sdZX0SIPDRZBYPUXuh5zMbW+q2P6Slx5R62UPoAxEvoRLCVf7bkvdacjrF2e3BZx
ssmQMHMnslUgcVFfsnoXFzyEOwhHO38n3jfEGOxWWc0lPBmLyhyk7P9Ba2kPRO+r
osRuukXky+r5pWsS2Jmcf5DkpO0khMTuM9Kkndl9AoGAcnUr2CYaTt2z1gYxLxGJ
8okyFARlsfYlg8MEjw9tTn/xBOm3EwjAm2aGg3t1EJvcJFiOEBshrSZ7O8Q0zt1w
27w6Cq+yJ9vsL6W3zUfEUDyEmwpDr7xPCg8Sceh7Kc/lgUQVu5f/KaHYWiTIb2qg
zWQDUeItwVDxnIwpU7V+9Hg=
-----END PRIVATE KEY-----`;
