import * as utils from "node:util";
import { createRequire } from "node:module";
import * as childProcess from "node:child_process";
import dayjs from "dayjs";
import { ipcHandle } from "#main/lib/ipc";
import addonPath from "#resources/cpp-addon.node?asset";
import type { AutoInputToVCParams } from "#main/lib/ipc";
import type { AppContext } from "..";

interface NativeAddon {
  add(a: number, b: number): number;
  showAlert(message: string, title: string): number;
  autoInputToVC(
    zx: string,
    zh: string,
    czzzdw: string,
    sczzdw: string,
    mczzdw: string,
    czzzrq: string,
    sczzrq: string,
    mczzrq: string,
    ztx: number,
    ytx: number,
  ): Promise<boolean>;
}

const require = createRequire(import.meta.url);
const addon: NativeAddon = require(addonPath);
const execFile = utils.promisify(childProcess.execFile);

const autoInputToVC = async (
  appContext: AppContext,
  data: AutoInputToVCParams,
) => {
  const { profile } = appContext;
  const profileState = await profile.getState();
  const driverPath = profileState.driverPath;
  const cp = await execFile(driverPath, [
    "autoInputToVC",
    data.zx,
    data.zh,
    data.czzzdw,
    data.sczzdw,
    data.mczzdw,
    dayjs(data.czzzrq).format("YYYYMM"),
    dayjs(data.sczzrq).format("YYYYMMDD"),
    dayjs(data.mczzrq).format("YYYYMMDD"),
    data.ztx,
    data.ytx,
  ]);

  return cp.stdout;
};

const autoInputToVCNaive = async (data: AutoInputToVCParams) => {
  await addon.autoInputToVC(
    data.zx,
    data.zh,
    data.czzzdw,
    data.sczzdw,
    data.mczzdw,
    dayjs(data.czzzrq).format("YYYYMM"),
    dayjs(data.sczzrq).format("YYYYMMDD"),
    dayjs(data.mczzrq).format("YYYYMMDD"),
    +data.ztx,
    +data.ytx,
  );

  return "";
};

export const bindIpcHandlers = (appContext: AppContext) => {
  ipcHandle("WIN/autoInputToVC", async (_, data: AutoInputToVCParams) => {
    try {
      await autoInputToVCNaive(data);

      return "";
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }

      const stdout = await autoInputToVC(appContext, data);

      return stdout;
    }
  });
};
