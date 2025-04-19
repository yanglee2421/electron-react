import { execFile, exec } from "node:child_process";
import { promisify } from "node:util";
import { access, constants } from "node:fs/promises";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export const getCpuSerial = async () => {
  const data = await execAsync(
    "Get-CimInstance -ClassName Win32_Processor | Select-Object ProcessorId",
    { shell: "powershell" },
  );

  if (data.stderr) {
    throw data.stderr;
  }

  return data.stdout;
};

export const getMotherboardSerial = async () => {
  const data = await execAsync(
    "Get-WmiObject win32_baseboard | Select-Object SerialNumber",
    { shell: "powershell" },
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
    winword_paths.map((path) => verifyPath(path)),
  );

  const winword = winwords.find(
    (result) => result.status === "fulfilled",
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
    { windowsVerbatimArguments: false, shell: false },
  );
  return cp;
};
