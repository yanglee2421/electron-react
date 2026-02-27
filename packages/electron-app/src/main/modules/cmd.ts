import dayjs from "dayjs";
import { ipcHandle } from "#main/lib/ipc";
import addon from "@yanglee2421/cpp-addon";
import type { AutoInputToVCParams } from "#main/lib/ipc";
import type { AppContext } from "..";

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

  ipcHandle("WIN/isRunAsAdmin", async () => {
    return addon.isRunAsAdmin();
  });
};
