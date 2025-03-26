import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, constants } from "node:fs/promises";
import { generateKeyPair, publicEncrypt, privateEncrypt } from "node:crypto";

export const execAsync = promisify(exec);
export const execFileAsync = promisify(execFile);

export const throwError = (error: unknown) => {
  if (error instanceof Error) {
    throw error.message;
  }

  if (typeof error === "string") {
    throw error;
  }

  throw String(error);
};

export const getCpuSerial = async () => {
  const data = await execAsync(
    "Get-CimInstance -ClassName Win32_Processor | Select-Object ProcessorId",
    { shell: "powershell" }
  );

  if (data.stderr) {
    throwError(data.stderr);
  }

  return data.stdout;
};

export const getMotherboardSerial = async () => {
  const data = await execAsync(
    "Get-WmiObject win32_baseboard | Select-Object SerialNumber",
    { shell: "powershell" }
  );

  if (data.stderr) {
    throwError(data.stderr);
  }

  return data.stdout;
};

const winword_paths = [
  "C:\\Program Files (x86)\\Microsoft Office\\Office16\\WINWORD.EXE",
  "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
  "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
  "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
];

const getWinword = async (path: string) => {
  await access(path, constants.R_OK);
  return path;
};

export const runWinword = async (data: string) => {
  const winwords = await Promise.allSettled(
    winword_paths.map((path) => getWinword(path))
  );

  const winword = winwords.find((i) => i.status === "fulfilled")?.value;

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
    { windowsVerbatimArguments: false, shell: false }
  );
  return cp;
};
