import { ipcMain, shell } from "electron";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { execFile, exec } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { settings } from "./store";
import { DATE_FORMAT_DATABASE } from "./cmd";
import { withLog } from "./lib";
import { channel } from "./channel";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const stdoutMap = new WeakMap<() => void, string>();

export const getCpuSerial = async () => {
  const cache = stdoutMap.get(getCpuSerial);
  if (cache) return cache;

  // Very slow, so we need to cache the result
  const data = await execAsync(
    "Get-CimInstance -ClassName Win32_Processor | Select-Object ProcessorId",
    { shell: "powershell" },
  );

  if (data.stderr) {
    throw new Error(data.stderr);
  }

  /**
   * Performance Optimization:
   * Cache CPU serial information to avoid redundant queries.
   * CPU serial number remains constant throughout the application runtime,
   * thus it's safe to prefetch and store it in memory.
   */
  stdoutMap.set(getCpuSerial, data.stdout);
  return data.stdout;
};

export const getMotherboardSerial = async () => {
  const cache = stdoutMap.get(getMotherboardSerial);
  if (cache) return cache;

  // Fast than getCpuSerial, but still need to cache the result
  const data = await execAsync(
    "Get-WmiObject win32_baseboard | Select-Object SerialNumber",
    { shell: "powershell" },
  );

  if (data.stderr) {
    throw new Error(data.stderr);
  }

  /**
   * Performance Optimization:
   * Cache motherboard serial information to avoid redundant queries.
   * Motherboard serial number remains constant throughout the application runtime,
   * thus it's safe to prefetch and store it in memory.
   */
  stdoutMap.set(getMotherboardSerial, data.stdout);
  return data.stdout;
};

export const getSerialFromStdout = (stdout: string) => {
  return stdout.trim().split("\n").at(-1) || "";
};

export const verifyActivation = async () => {
  const cpuSerial = await getCpuSerial();
  const serial = getSerialFromStdout(cpuSerial);
  const activateCode = settings.get("activateCode");
  const exceptedCode = createHash("md5")
    .update([serial, DATE_FORMAT_DATABASE].join(""))
    .digest("hex")
    .toUpperCase();

  return Object.is(activateCode, exceptedCode);
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
    winword_paths.map((path) => verifyPath(path)),
  );

  const winword = winwords.find(
    (result) => result.status === "fulfilled",
  )?.value;

  if (!winword) {
    throw new Error("Find winword failed");
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
    { windowsVerbatimArguments: false, shell: false },
  );
  return cp;
};

export const initIpc = () => {
  ipcMain.handle(
    channel.printer,
    withLog(async (e, data: string): Promise<void> => {
      void e;
      // Ensure an error is thrown when the promise is rejected
      await runWinword(data).catch(() => shell.openPath(data));
    }),
  );

  ipcMain.handle(
    channel.verifyActivation,
    withLog(async (): Promise<{ isOk: boolean; serial: string }> => {
      const cpuSerial = await getCpuSerial();
      const serial = getSerialFromStdout(cpuSerial);
      const isOk = await verifyActivation();

      return { isOk, serial };
    }),
  );
};
