import { createRequire } from "node:module";
import dayjs from "dayjs";
import { ipcHandle } from "#main/lib/ipc";
import addonPath from "#resources/cpp-addon.node?asset";
import type { AutoInputToVCParams } from "#main/lib/ipc";
import type { AppContext } from "..";

interface NativeAddon {
  add(a: number, b: number): number;
  isRunAsAdmin(): boolean;
  showAlert(message: string, title: string): Promise<number>;
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
  void appContext;

  ipcHandle("WIN/autoInputToVC", async (_, data: AutoInputToVCParams) => {
    await autoInputToVCNaive(data);

    return "";
  });
};
