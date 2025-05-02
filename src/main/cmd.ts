import { ipcMain } from "electron/main";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import dayjs from "dayjs";
import { withLog } from "./lib";
import * as store from "./store";
import * as channel from "./channel";

const execFileAsync = promisify(execFile);
export const DATE_FORMAT_DATABASE = "YYYY/MM/DD HH:mm:ss";

export const getDataFromAccessDatabase = async <TRecord = unknown>(
  sql: string,
) => {
  const config = store.settings.store;
  const data = await execFileAsync(config.driverPath, [
    "GetDataFromAccessDatabase",
    config.databasePath,
    sql,
  ]);

  if (data.stderr) {
    throw new Error(data.stderr);
  }

  return JSON.parse(data.stdout) as TRecord[];
};

export type Detection = {
  bFlaws: boolean | null;
  bSickLD: boolean | null;
  bSickRD: boolean | null;
  bWheelLS: boolean | null;
  bWheelRS: boolean | null;
  ftRadiu: number | null;
  szIDs: string;
  szIDsFirst: string | null;
  szIDsLast: string | null;
  szIDsMake: string | null;
  /**
   * @description 轴号
   */
  szIDsWheel: string | null;
  szMemo: string | null;
  szResult: string | null;
  szTMFirst: string | null;
  szTMLast: string | null;
  szTMMake: string | null;
  szUsername: string | null;
  /**
   * @description 轴型
   */
  szWHModel: string | null;
  tmnow: string | null;
};

export type DetectionData = {
  ManualRes: string | null;
  bEnable: boolean;
  fltValueUS: number;
  fltValueUSH: number;
  fltValueX: number;
  fltValueY: number;
  nAtten: number;
  nBoard: number;
  nChannel: number;
  nFWCount: number;
  nFWIn: number;
  nFWIndex: number;
  nFWOut: number;
  nTAIndex: number;
  opid: string | null;
};

export const getDetectionByZH = async (params: {
  zh: string;
  startDate: string;
  endDate: string;
}) => {
  const startDate = dayjs(params.startDate).format(DATE_FORMAT_DATABASE);
  const endDate = dayjs(params.endDate).format(DATE_FORMAT_DATABASE);

  const [detection] = await getDataFromAccessDatabase<Detection>(
    `SELECT TOP 1 * FROM detections WHERE szIDsWheel ='${params.zh}' AND tmnow BETWEEN #${startDate}# AND #${endDate}# ORDER BY tmnow DESC`,
  );

  if (!detection) {
    throw `未找到轴号[${params.zh}]的detections记录`;
  }

  return detection;
};

export const getDetectionDatasByOPID = async (opid: string) => {
  const detectionDatas = await getDataFromAccessDatabase<DetectionData>(
    `SELECT * FROM detections_data WHERE opid ='${opid}'`,
  );

  return detectionDatas;
};

export type Corporation = {
  DeviceNO: string | null;
};

export const getCorporation = async () => {
  const [corporation] = await getDataFromAccessDatabase<Corporation>(
    "SELECT TOP 1 * FROM corporation",
  );

  if (!corporation) {
    throw "未找到公司信息";
  }

  return corporation;
};

export type Verify = {
  bFlaws: boolean;
  bSickLD: boolean;
  bSickRD: boolean;
  bWheelLS: boolean;
  bWheelRS: boolean;
  ftRadiu: number;
  szIDs: string;
  szIDsFirst: string | null;
  szIDsLast: string | null;
  szIDsMake: string | null;
  szIDsWheel: string | null;
  szMemo: string | null;
  szResult: string | null;
  szTMFirst: string | null;
  szTMLast: string | null;
  szTMMake: string | null;
  szUsername: string | null;
  szWHModel: string | null;
  tmNow: string | null;
};

export type VerifyData = {
  ManualRes: string | null;
  bEnable: boolean;
  fltValueUS: number;
  fltValueUSH: number;
  fltValueX: number;
  fltValueY: number;
  nAtten: number;
  nBoard: number;
  nChannel: number;
  nFWCount: number;
  nFWIn: number;
  nFWIndex: number;
  nFWOut: number;
  nTAIndex: number;
  opid: string | null;
};

export type Quartor = {
  szIDs: string;
  szIDsWheel: string | null;
  szWHModel: string | null;
  szUsername: string | null;
  szIDsMake: string | null;
  szIDsFirst: string | null;
  szIDsLast: string | null;
  szTMMake: string | null;
  szTMFirst: string | null;
  szTMLast: string | null;
  ftRadiu: number | null;
  bFlaws: boolean | null;
  bWheelLS: boolean | null;
  bWheelRS: boolean | null;
  bSickLD: boolean | null;
  bSickRD: boolean | null;
  tmnow: string | null;
  szResult: string | null;
  szMemo: string | null;
  DB: string | null;
  bJiXiaoReportOut: boolean | null;
  bHeGe: boolean | null;
  startTime: string | null;
  endTime: string | null;
};

export type QuartorData = {
  opid: string | null;
  nBoard: number;
  nChannel: number;
  nTAIndex: number;
  nAtten: number;
  nFWIndex: number;
  nFWIn: number;
  nFWOut: number;
  nFWCount: number;
  fltValueX: number;
  fltValueY: number;
  fltValueUS: number;
  fltValueUSH: number;
  bEnable: boolean;
  ManualRes: string | null;
};

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

const autoInputToVC = async (data: AutoInputToVCParams) => {
  const driverPath = store.settings.get("driverPath");
  const cp = await execFileAsync(driverPath, [
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

  if (cp.stderr) {
    throw cp.stderr;
  }

  return cp.stdout;
};

export const initIpc = () => {
  ipcMain.handle(
    channel.getDataFromAccessDatabase,
    withLog(async (e, sql: string) => {
      void e;
      return await getDataFromAccessDatabase(sql);
    }),
  );

  ipcMain.handle(
    channel.autoInputToVC,
    withLog(async (e, data: AutoInputToVCParams) => {
      void e;
      return await autoInputToVC(data);
    }),
  );
};
