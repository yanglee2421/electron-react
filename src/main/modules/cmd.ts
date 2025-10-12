import * as fs from "node:fs";
import * as path from "node:path";
import * as utils from "node:util";
import * as childProcess from "node:child_process";
import { access, mkdir, rm, cp } from "node:fs/promises";
import dayjs from "dayjs";
import { app } from "electron";
import { channel } from "#/channel";
import { ipcHandle } from "#/lib";
import { getProfile } from "#/lib/profile";
import { getDataFromAppDB, getDataFromRootDB as getDataFromMDB } from "./mdb";

const execFile = utils.promisify(childProcess.execFile);

/**
 * When users use antivirus software like 360
 * The driver path may be locked by the antivirus software and cannot be accessed
 * In this case, we need to copy the driver to a new path and call it again
 */
const execFileAsyncWithRetry = async (driverPath: string, args: string[]) => {
  try {
    const data = await execFile(driverPath, args);

    if (data.stderr) {
      throw new Error(data.stderr);
    }

    return data;
  } catch {
    const driverDir = path.dirname(driverPath);
    const newDriverDir = path.join(
      app.getPath("temp"),
      "wtxy_tookit_cmd",
      `${Date.now()}`,
    );

    try {
      await access(newDriverDir, fs.constants.R_OK);
    } catch {
      await rm(path.resolve(newDriverDir, "../"), {
        recursive: true,
        force: true,
      });
      await mkdir(newDriverDir, { recursive: true });
    }

    await cp(driverDir, newDriverDir, {
      recursive: true,
      force: true,
      preserveTimestamps: true,
      dereference: false,
      errorOnExist: false,
    });
    const data = await execFile(
      driverPath.replace(driverDir, newDriverDir),
      args,
    );

    if (data.stderr) {
      throw new Error(data.stderr);
    }

    return data;
  }
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
  const startDate = dayjs(params.startDate).toISOString();
  const endDate = dayjs(params.endDate).toISOString();

  const {
    rows: [detection],
  } = await getDataFromMDB<Detection>({
    tableName: "detections",
    filters: [
      {
        type: "equal",
        field: "szIDsWheel",
        value: params.zh,
      },
      {
        type: "date",
        field: "tmnow",
        startAt: startDate,
        endAt: endDate,
      },
    ],
  });

  if (!detection) {
    throw new Error(`未找到轴号[${params.zh}]的detections记录`);
  }

  return detection;
};

export const getDetectionDatasByOPID = async (opid: string) => {
  const detectionDatas = await getDataFromMDB<DetectionData>({
    tableName: "detections_data",
    filters: [
      {
        type: "equal",
        field: "opid",
        value: opid,
      },
    ],
  });

  return detectionDatas.rows;
};

export type Corporation = {
  DeviceNO: string | null;
};

export const getCorporation = async () => {
  const {
    rows: [corporation],
  } = await getDataFromAppDB<Corporation>({
    tableName: "corporation",
  });

  if (!corporation) {
    throw new Error("未找到公司信息");
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
  const profile = await getProfile();
  const driverPath = profile.driverPath;
  const cp = await execFileAsyncWithRetry(driverPath, [
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

export const initIpc = () => {
  ipcHandle(channel.autoInputToVC, async (_, data: AutoInputToVCParams) => {
    return await autoInputToVC(data);
  });
};
