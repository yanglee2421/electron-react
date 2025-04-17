// 京天威 统型

import { net } from "electron";
import {
  getDetectionDatasByOPID,
  getDetectionByZH,
  log,
  getIP,
  getCorporation,
} from "./lib";
import dayjs from "dayjs";
import { URL } from "node:url";
import { db } from "./db";
import * as schema from "./schema";
import * as sql from "drizzle-orm";
import { setting } from "./setting";
import type {
  DetectionData,
  DatabaseBaseParams,
} from "#/electron/database_types";

class JtvHmisSetting {
  listeners = new Set<() => void>();
  on(handler: () => void) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }
  emit() {
    this.listeners.forEach((listener) => listener());
  }

  hasInitialized = false;
  snapshot: schema.JTVSetting = {
    id: 0,
    host: null,
    autoInput: null,
    autoUpload: null,
    autoUploadInterval: null,
    unitCode: null,
  };

  async init() {
    const setting = await db.query.jtvSettingTable.findFirst({
      where: sql.eq(schema.jtvSettingTable.id, 1),
    });

    if (!setting) {
      const [created] = await db
        .insert(schema.jtvSettingTable)
        .values({
          id: 1,
        })
        .returning();

      this.snapshot = created;
    } else {
      this.snapshot = setting;
    }

    this.hasInitialized = true;
    this.emit();
  }

  async get() {
    if (!this.hasInitialized) {
      await this.init();
    }

    return this.snapshot;
  }

  async set(params: Partial<Omit<schema.JTVSetting, "id">>) {
    const [updated] = await db
      .insert(schema.jtvSettingTable)
      .values({ ...params, id: 1 })
      .onConflictDoUpdate({
        target: schema.jtvSettingTable.id,
        targetWhere: sql.eq(schema.jtvSettingTable.id, 1),
        set: params,
      })
      .returning();

    this.snapshot = updated;
    this.emit();
  }
}

export const jtvHmisSetting = new JtvHmisSetting();

class AutoUploadTask {
  timer: NodeJS.Timeout | null = null;
  delay = 1000 * 30;

  constructor(private handle: () => void) {}

  start() {
    const fn = () => {
      this.timer = setTimeout(fn, this.delay);
      this.handle();
    };
    fn();
  }
  abort() {
    if (!this.timer) return;
    clearTimeout(this.timer);
  }
}

const autoUploadTask = new AutoUploadTask(async () => {
  const hmis = jtvHmisSetting.snapshot;
  const commonSetting = setting.snapshot;
  const host = hmis.host || "";
  const barcodes = await db.query.jtvBarcodeTable.findMany({
    where: sql.eq(schema.jtvBarcodeTable.isUploaded, false),
  });

  for (const barcode of barcodes) {
    await uploadBarcode(barcode, host, commonSetting).catch((e: Error) => {
      log(`上传失败:${JSON.stringify(barcode)},${e.message}`);
    });
  }
});

jtvHmisSetting.on(async () => {
  const setting = await jtvHmisSetting.get();
  const autoUpload = setting.autoUpload || false;
  const autoUploadInterval = setting.autoUploadInterval || 1000 * 30;
  if (autoUpload) {
    autoUploadTask.delay = autoUploadInterval;
    autoUploadTask.start();
  } else {
    autoUploadTask.abort();
  }
});

/**
 * 上传条码记录到远程服务器
 * @param barcode 条码记录
 * @param host 服务器地址
 * @param unitCode 单位代码
 * @param commonSetting 通用配置
 * @returns 上传结果
 */
export const uploadBarcode = async (
  barcode: schema.JTVBarcode,
  host: string,
  commonSetting: schema.Settings,
) => {
  try {
    const startDate = dayjs().startOf("day").toISOString();
    const endDate = dayjs().endOf("day").toISOString();
    const eq_ip = getIP();
    const corporation = await getCorporation({
      driverPath: commonSetting.driverPath || "",
      databasePath: commonSetting.databasePath || "",
    });

    const record = {
      dh: barcode.barCode || "",
      zh: barcode.zh || "",
    };

    const postData = await recordToSaveDataParams(
      record,
      eq_ip,
      corporation.DeviceNO || "",
      startDate,
      endDate,
      commonSetting.driverPath || "",
      commonSetting.databasePath || "",
    );

    await postFn({
      data: [postData],
      host,
    });

    // 更新记录状态为已上传
    await db
      .update(schema.jtvBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.jtvBarcodeTable.id, barcode.id))
      .execute();

    log(`条码上传成功: ${barcode.barCode}`);
  } catch (error) {
    throw new Error(`上传条码失败: ${error}`);
  }
};

/**
 * 根据多个ID查询对应的条码记录
 * @param ids 条码ID数组
 * @returns 条码记录数组
 */
export const getBarcodesByIds = async (
  ids: number[],
): Promise<schema.JTVBarcode[]> => {
  if (!ids.length) return [];

  return await db.query.jtvBarcodeTable.findMany({
    where: sql.inArray(schema.jtvBarcodeTable.id, ids),
  });
};

/**
 * 查询一组条码记录并上传
 * @param barcodeIds 条码ID数组
 * @param host 服务器地址
 * @param unitCode 单位代码
 * @param commonSetting 通用配置
 * @returns 上传结果
 */
export const uploadMultipleBarcodes = async (
  barcodeIds: number[],
  host: string,
): Promise<{ success: number; failed: number }> => {
  if (!barcodeIds.length) return { success: 0, failed: 0 };

  const commonSetting = setting.snapshot;
  const barcodes = await getBarcodesByIds(barcodeIds);
  let success = 0;
  let failed = 0;

  for (const barcode of barcodes) {
    try {
      await uploadBarcode(barcode, host, commonSetting);
      success++;
    } catch (error) {
      log(`批量上传失败: ID=${barcode.id}, ${error}`);
      failed++;
    }
  }

  return { success, failed };
};

export type GetResponse = {
  code: "200";
  msg: "数据读取成功";
  data: [
    {
      CZZZDW: "048";
      CZZZRQ: "2009-10";
      MCZZDW: "131";
      MCZZRQ: "2018-07-09 00:00:00";
      SCZZDW: "131";
      SCZZRQ: "2018-07-09 00:00:00";
      DH: "91022070168";
      ZH: "67444";
      ZX: "RE2B";
      SRYY: "厂修";
      SRDW: "588";
    },
  ];
};

export type GetRequest = {
  barCode: string;
  host: string;
  unitCode: string;
};

export const getFn = async (request: GetRequest) => {
  const url = new URL(`http://${request.host}/api/getData`);
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", [request.barCode, request.unitCode].join(","));
  log(`请求数据:${url.href}`);
  const res = await net.fetch(url.href, { method: "GET" });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data: GetResponse = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  return data;
};

export type PostRequestItem = {
  eq_ip: string; // 设备IP
  eq_bh: string; // 设备编号
  dh: string; // 扫码单号
  zx: string; // RE2B
  zh: string; // 03684
  TSFF: string;
  TSSJ: string;
  TFLAW_PLACE: string; // 缺陷部位
  TFLAW_TYPE: string; // 缺陷类型
  TVIEW: string; // 处理意见
  CZCTZ: string; // 左穿透签章
  CZCTY: string; // 右穿透签章
  LZXRBZ: string; // 左轮座签章
  LZXRBY: string; // 右轮座签章
  XHCZ: string; // 左轴颈签章
  XHCY: string; // 右轴颈签章
  TSZ: string; // 探伤者左
  TSZY: string; // 探伤者右
  CT_RESULT: string; // 合格
};

export type PostRequest = {
  data: PostRequestItem[];
  host: string;
};

export type PostResponse = {
  code: "200";
  msg: "数据上传成功";
};

export const postFn = async (request: PostRequest) => {
  const url = new URL(`http://${request.host}/api/saveData`);
  url.searchParams.set("type", "csbts");
  const body = JSON.stringify(request.data);
  log(`请求数据:${url.href},${body}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data: PostResponse = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (data.code !== "200") {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};

type Record = {
  dh: string;
  zh: string;
};

export type SaveDataParams = DatabaseBaseParams & {
  host: string;
  records: {
    dh: string;
    zh: string;
  }[];
};

export const recordToSaveDataParams = async (
  record: Record,
  eq_ip: string,
  eq_bh: string,
  startDate: string,
  endDate: string,
  driverPath: string,
  databasePath: string,
): Promise<PostRequestItem> => {
  const detection = await getDetectionByZH({
    driverPath,
    databasePath,
    zh: record.zh,
    startDate,
    endDate,
  });

  const user = detection.szUsername || "";
  let detectionDatas: DetectionData[] = [];
  let TFLAW_PLACE = "";
  let TFLAW_TYPE = "";
  let TVIEW = "";

  switch (detection.szResult) {
    case "故障":
    case "有故障":
    case "疑似故障":
      TFLAW_PLACE = "车轴";
      TFLAW_TYPE = "裂纹";
      TVIEW = "人工复探";
      detectionDatas = await getDetectionDatasByOPID({
        databasePath,
        driverPath,
        opid: detection.szIDs,
      });
      break;
    default:
  }

  detectionDatas.forEach((detectionData) => {
    switch (detectionData.nChannel) {
      case 0:
        TFLAW_PLACE = "穿透";
        break;
      case 1:
      case 2:
        TFLAW_PLACE = "卸荷槽";
        break;
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        TFLAW_PLACE = "轮座";
        break;
    }
  });

  return {
    eq_ip,
    eq_bh,
    dh: record.dh,
    zx: detection.szWHModel || "",
    zh: record.zh,
    TSFF: "超声波",
    TSSJ: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
    TFLAW_PLACE,
    TFLAW_TYPE,
    TVIEW,
    CZCTZ: user,
    CZCTY: user,
    LZXRBZ: user,
    LZXRBY: user,
    XHCZ: user,
    XHCY: user,
    TSZ: user,
    TSZY: user,
    CT_RESULT: detection.szResult || "",
  };
};
