import { exec } from "node:child_process";
import { promisify } from "node:util";

export const throwError = (error: unknown) => {
  if (error instanceof Error) {
    throw error.message;
  }

  if (typeof error === "string") {
    throw error;
  }

  throw String(error);
};

const execAsync = promisify(exec);

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
