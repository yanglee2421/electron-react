import type { AutoInputToVCParams } from "#main/lib/ipc";
import { type IpcHandle } from "#main/lib/ipc";
import addon from "@yanglee2421/cpp-addon";
import dayjs from "dayjs";

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

export const bindIpcHandlers = (ipcHandle: IpcHandle) => {
  ipcHandle("WIN/autoInputToVC", async (_, data: AutoInputToVCParams) => {
    await autoInputToVCNaive(data);

    return "";
  });

  ipcHandle("WIN/isRunAsAdmin", async () => {
    return addon.isRunAsAdmin();
  });
};
