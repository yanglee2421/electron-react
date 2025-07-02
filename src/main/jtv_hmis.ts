// 京天威 统型

import { net, ipcMain } from "electron";
import { log, getIP, withLog, createEmit } from "./lib";
import {
  getCorporation,
  getDetectionByZH,
  getDetectionDatasByOPID,
} from "./cmd";
import dayjs from "dayjs";
import { URL } from "node:url";
import { jtv_hmis } from "./store";
import { db } from "./db";
import * as schema from "./schema";
import * as sql from "drizzle-orm";
import * as channel from "./channel";
import * as win from "./win";
import type { DetectionData } from "./cmd";
import type * as PRELOAD from "~/index";
import type { JTV_HMIS } from "./store";

/**
 * Sqlite barcode
 */
const sqlite_get = async (
  params: PRELOAD.JtvBarcodeGetParams,
): Promise<PRELOAD.JtvBarcodeGetResult> => {
  const [{ count }] = await db
    .select({ count: sql.count() })
    .from(schema.jtvBarcodeTable)
    .where(
      sql.between(
        schema.jtvBarcodeTable.date,
        new Date(params.startDate),
        new Date(params.endDate),
      ),
    )
    .limit(1);
  const rows = await db.query.jtvBarcodeTable.findMany({
    where: sql.between(
      schema.jtvBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate),
    ),
    offset: params.pageIndex * params.pageSize,
    limit: params.pageSize,
  });
  return { rows, count };
};

const sqlite_delete = async (id: number): Promise<schema.JTVBarcode> => {
  const [result] = await db
    .delete(schema.jtvBarcodeTable)
    .where(sql.eq(schema.jtvBarcodeTable.id, id))
    .returning();
  return result;
};

/**
 * HMIS API
 */
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

const fetch_get = async (barcode: string) => {
  const host = jtv_hmis.get("host");
  const unitCode = jtv_hmis.get("unitCode");
  const url = new URL(`http://${host}/api/getData`);
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", [barcode, unitCode].join(","));
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

type PostResponse = {
  code: "200";
  msg: "数据上传成功";
};

const fetch_set = async (request: PostRequestItem[]) => {
  const host = jtv_hmis.get("host");
  const url = new URL(`http://${host}/api/saveData`);
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
const api_get = async (barcode: string): Promise<GetResponse> => {
  const data = await fetch_get(barcode);

  await db.insert(schema.jtvBarcodeTable).values({
    barCode: barcode,
    zh: data.data[0].ZH,
    date: new Date(),
    isUploaded: false,
  });

  return data;
};

const recordToBody = async (
  record: schema.JTVBarcode,
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

  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();
  const eq_ip = getIP();
  const corporation = await getCorporation();
  const eq_bh = corporation.DeviceNO || "";

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
    eq_ip,
    eq_bh,
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

const emit = createEmit(channel.jtv_hmis_api_set);

const api_set = async (id: number): Promise<schema.JTVBarcode> => {
  const record = await db.query.jtvBarcodeTable.findFirst({
    where: sql.eq(schema.jtvBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  const body = await recordToBody(record);
  await fetch_set([body]);
  const [result] = await db
    .update(schema.jtvBarcodeTable)
    .set({ isUploaded: true })
    .where(sql.eq(schema.jtvBarcodeTable.id, record.id))
    .returning();
  emit();

  return result;
};

/**
 * Auto upload
 */
const doTask = withLog(api_set);
let timer: NodeJS.Timeout | null = null;

const autoUploadHandler = async () => {
  const delay = jtv_hmis.get("autoUploadInterval") * 1000;
  timer = setTimeout(autoUploadHandler, delay);

  const activated = win.verifyActivation();
  if (!activated) return;

  const barcodes = await db.query.jtvBarcodeTable.findMany({
    where: sql.and(
      sql.eq(schema.jtvBarcodeTable.isUploaded, false),
      sql.between(
        schema.jtvBarcodeTable.date,
        dayjs().startOf("day").toDate(),
        dayjs().endOf("day").toDate(),
      ),
    ),
  });

  for (const barcode of barcodes) {
    await doTask(barcode.id).catch(Boolean);
  }
};

const initAutoUpload = () => {
  if (jtv_hmis.get("autoUpload")) {
    autoUploadHandler();
  }

  jtv_hmis.onDidChange("autoUpload", (value) => {
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
    channel.jtv_hmis_sqlite_get,
    withLog(
      async (
        e,
        params: PRELOAD.JtvBarcodeGetParams,
      ): Promise<PRELOAD.JtvBarcodeGetResult> => {
        void e;
        const data = await sqlite_get(params);
        return data;
      },
    ),
  );

  ipcMain.handle(
    channel.jtv_hmis_sqlite_delete,
    withLog(async (e, id: number): Promise<schema.JTVBarcode> => {
      void e;
      return await sqlite_delete(id);
    }),
  );

  ipcMain.handle(
    channel.jtv_hmis_api_get,
    withLog(async (e, barcode: string): Promise<GetResponse> => {
      void e;
      return await api_get(barcode);
    }),
  );

  ipcMain.handle(
    channel.jtv_hmis_api_set,
    withLog(async (e, id: number): Promise<schema.JTVBarcode> => {
      void e;
      const data = await api_set(id);
      return data;
    }),
  );

  ipcMain.handle(
    channel.jtv_hmis_setting,
    withLog(
      async (e, data?: PRELOAD.JtvHmisSettingParams): Promise<JTV_HMIS> => {
        void e;
        if (data) {
          jtv_hmis.set(data);
        }
        return jtv_hmis.store;
      },
    ),
  );
};

export const init = () => {
  initIpc();
  initAutoUpload();
};
