// 成都北 华兴致远

import { net, ipcMain } from "electron";
import { log, getIP, withLog } from "./lib";
import {
  getDetectionByZH,
  getDetectionDatasByOPID,
  getDataFromAccessDatabase,
  getCorporation,
} from "./cmd";
import dayjs from "dayjs";
import { URL } from "node:url";
import { hxzy_hmis } from "./store";
import { db } from "./db";
import * as sql from "drizzle-orm";
import * as schema from "./schema";
import * as channel from "./channel";
import type { DetectionData, Verify, VerifyData } from "./cmd";
import type * as PRELOAD from "./preload";

/**
 * Sqlite barcode
 */
const sqlite_get = async (
  params: PRELOAD.HxzyBarcodeGetParams,
): Promise<PRELOAD.HxzyBarcodeGetResult> => {
  const [{ count }] = await db
    .select({ count: sql.count() })
    .from(schema.hxzyBarcodeTable)
    .where(
      sql.between(
        schema.hxzyBarcodeTable.date,
        new Date(params.startDate),
        new Date(params.endDate),
      ),
    )
    .limit(1);
  const rows = await db.query.hxzyBarcodeTable.findMany({
    where: sql.between(
      schema.hxzyBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate),
    ),
    offset: params.pageIndex * params.pageSize,
    limit: params.pageSize,
  });
  return { rows, count };
};

const sqlite_delete = async (id: number): Promise<schema.HxzyBarcode> => {
  const [result] = await db
    .delete(schema.hxzyBarcodeTable)
    .where(sql.eq(schema.hxzyBarcodeTable.id, id))
    .returning();
  return result;
};

/**
 * HMIS API
 */
type GetResponse = {
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

const fetch_get = async (barcode: string) => {
  const host = hxzy_hmis.get("host");
  const url = new URL(
    `http://${host}/lzjx/dx/csbts/device_api/csbts/api/getDate`,
  );
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", barcode);
  log(`请求数据:${url.href}`);
  const res = await net.fetch(url.href, { method: "GET" });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data: GetResponse = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);

  return data;
};

type PostRequestItem = {
  EQ_IP: string; // 设备IP
  EQ_BH: string; // 设备编号
  GD: string; // 股道号
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

type PostResponse = {
  code: "200";
  msg: "数据上传成功";
};

const fetch_set = async (request: PostRequestItem[]) => {
  const host = hxzy_hmis.get("host");
  const url = new URL(
    `http://${host}/lzjx/dx/csbts/device_api/csbts/api/saveData`,
  );
  url.searchParams.set("type", "csbts");
  const body = JSON.stringify(request);
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

/**
 * Ipc handlers
 */
const api_get = async (barcode: string) => {
  const data = await fetch_get(barcode);

  const [result] = await db
    .insert(schema.hxzyBarcodeTable)
    .values({
      barCode: barcode,
      zh: data.data[0].ZH,
      date: new Date(),
      isUploaded: false,
    })
    .returning();

  return result;

  // const autoInput = hxzy_hmis.get("autoInput");

  // if (autoInput) return;
  // await autoInputToVC({
  //   zx: data.data[0].ZX,
  //   zh: data.data[0].ZH,
  //   czzzdw: data.data[0].CZZZDW,
  //   sczzdw: data.data[0].SCZZDW,
  //   mczzdw: data.data[0].MCZZDW,
  //   czzzrq: data.data[0].CZZZRQ,
  //   sczzrq: data.data[0].SCZZRQ,
  //   mczzrq: data.data[0].MCZZRQ,
  //   ztx: "1",
  //   ytx: "1",
  // });
};

const recordToBody = async (
  record: schema.HxzyBarcode,
): Promise<PostRequestItem> => {
  const id = record.id;

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }

  if (!record.barCode) {
    throw new Error(`记录#${id}条形码不存在`);
  }

  const corporation = await getCorporation();
  const EQ_IP = corporation.DeviceNO || "";
  const EQ_BH = getIP();
  const GD = hxzy_hmis.get("gd");
  const startDate = dayjs(record.date).startOf("day").toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();

  const detection = await getDetectionByZH({
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
      detectionDatas = await getDetectionDatasByOPID(detection.szIDs);
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
    EQ_IP,
    EQ_BH,
    GD,
    dh: record.barCode,
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

const api_set = async (id: number) => {
  const record = await db.query.hxzyBarcodeTable.findFirst({
    where: sql.eq(schema.hxzyBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }

  const postParams = await recordToBody(record);

  await fetch_set([postParams]);
  const [result] = await db
    .update(schema.hxzyBarcodeTable)
    .set({ isUploaded: true })
    .where(sql.eq(schema.hxzyBarcodeTable.id, id))
    .returning();

  return result;
};

const idToUploadVerifiesData = async (id: string) => {
  const [verifies] = await getDataFromAccessDatabase<Verify>(
    `SELECT * FROM verifies WHERE szIDs ='${id}'`,
  );

  if (!verifies) {
    throw new Error(`未找到ID[${id}]的verifies记录`);
  }

  const verifiesData = await getDataFromAccessDatabase<VerifyData>(
    `SELECT * FROM verifies_data WHERE opid ='${verifies.szIDs}'`,
  );

  return {
    verifies,
    verifiesData,
  };
};

/**
 * Auto upload
 */
const doTask = withLog(api_set);
let timer: NodeJS.Timeout | null = null;

const autoUploadHandler = async () => {
  const delay = hxzy_hmis.get("autoUploadInterval") * 1000;
  timer = setTimeout(autoUploadHandler, delay);

  const barcodes = await db.query.hxzyBarcodeTable.findMany({
    where: sql.eq(schema.hxzyBarcodeTable.isUploaded, false),
  });

  for (const barcode of barcodes) {
    await doTask(barcode.id).catch(Boolean);
  }
};

const initAutoUpload = () => {
  if (hxzy_hmis.get("autoUpload")) {
    autoUploadHandler();
  }

  hxzy_hmis.onDidChange("autoUpload", (value) => {
    if (value) {
      autoUploadHandler();
      return;
    }

    if (!timer) return;
    clearTimeout(timer);
  });
};

/**
 * Initialize
 */
const initIpc = () => {
  ipcMain.handle(
    channel.hxzy_hmis_sqlite_get,
    withLog(
      async (
        e,
        params: PRELOAD.HxzyBarcodeGetParams,
      ): Promise<PRELOAD.HxzyBarcodeGetResult> => {
        void e;
        const data = await sqlite_get(params);
        return data;
      },
    ),
  );

  ipcMain.handle(
    channel.hxzy_hmis_sqlite_delete,
    withLog(async (e, id: number): Promise<schema.HxzyBarcode> => {
      void e;
      return await sqlite_delete(id);
    }),
  );

  ipcMain.handle(
    channel.hxzy_hmis_api_get,
    withLog(async (e, barcode: string) => {
      void e;
      return await api_get(barcode);
    }),
  );

  ipcMain.handle(
    channel.hxzy_hmis_api_set,
    withLog(async (e, id: number) => {
      void e;
      return await api_set(id);
    }),
  );

  ipcMain.handle(
    channel.hxzy_hmis_api_verifies,
    withLog(async (e, id: string) => {
      void e;
      return await idToUploadVerifiesData(id);
    }),
  );

  ipcMain.handle(
    channel.hxzy_hmis_setting,
    withLog(async (e, data?: PRELOAD.HxzyHmisSettingParams) => {
      void e;
      if (data) {
        hxzy_hmis.set(data);
      }
      return hxzy_hmis.store;
    }),
  );
};

export const init = () => {
  initIpc();
  initAutoUpload();
};
