import { parse } from "csv/sync";
import iconv from "iconv-lite";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { from, interval, switchMap } from "rxjs";

const execAsync = promisify(exec);

export const tasklist = async () => {
  const cmd = `tasklist /FI "IMAGENAME eq 货车轮轴超声波自动探伤系统.exe" /FO CSV`;
  const { stdout } = await execAsync(cmd, { encoding: "buffer" });
  const str = iconv.decode(stdout, "gbk").toString();

  return parse(str).flat(Infinity).includes("货车轮轴超声波自动探伤系统.exe");
};

export const fromTasklist = (delay: number) => {
  return interval(delay).pipe(switchMap(() => from(tasklist())));
};
