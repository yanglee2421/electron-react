import { type IpcHandle } from "#main/lib/ipc";
import addon from "@yanglee2421/cpp-addon";
import dayjs from "dayjs";

export type AutoInputToVCParams = {
  zx: string;
  zh: string;
  czzzdw: string;
  sczzdw: string;
  mczzdw: string;
  czzzrq: string;
  sczzrq: string;
  mczzrq: string;
  ztx: string;
  ytx: string;
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

export interface Ipc {
  "WIN/autoInputToVC": {
    args: [AutoInputToVCParams];
    return: string;
  };
  "WIN/isRunAsAdmin": {
    args: [];
    return: boolean;
  };
}

export const bindIpcHandlers = (ipcHandle: IpcHandle) => {
  ipcHandle("WIN/autoInputToVC", async (_, data: AutoInputToVCParams) => {
    await autoInputToVCNaive(data);

    return "";
  });

  ipcHandle("WIN/isRunAsAdmin", async () => {
    return addon.isRunAsAdmin();
  });
};
