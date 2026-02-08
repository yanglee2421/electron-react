import * as utils from "node:util";
import * as childProcess from "node:child_process";
import dayjs from "dayjs";
import { ipcHandle } from "#main/lib/ipc";
import type { AutoInputToVCParams } from "#main/lib/ipc";
import type { AppContext } from "..";

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

export const bindIpcHandlers = (appContext: AppContext) => {
  ipcHandle("WIN/autoInputToVC", async (_, data: AutoInputToVCParams) => {
    return await autoInputToVC(appContext, data);
  });
};
