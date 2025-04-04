export const getSerialFromStdout = (stdout: string) => {
  return stdout.trim().split("\n").at(-1) || "";
};
