// 京天威 统型

import dayjs from "dayjs";
import { net } from "electron";
import * as sql from "drizzle-orm";
import { log, withLog, ipcHandle, db, getIP, createEmit } from "#main/lib";
import * as schema from "#main/schema";
import { channel } from "#main/channel";
import {
  jtv_hmis_guangzhoubei,
  type JTV_HMIS_Guangzhoubei,
} from "#main/lib/store";
import {
  getCorporation,
  getDetectionByZH,
  getDetectionDatasByOPID,
} from "#main/modules/cmd";
import type { DetectionData } from "#main/modules/cmd";

type SQLiteGetParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

/**
 * Sqlite barcode
 */
const sqlite_get = async (params: SQLiteGetParams) => {
  const [{ count }] = await db
    .select({ count: sql.count() })
    .from(schema.jtvGuangzhoubeiBarcodeTable)
    .where(
      sql.between(
        schema.jtvGuangzhoubeiBarcodeTable.date,
        new Date(params.startDate),
        new Date(params.endDate),
      ),
    )
    .limit(1);
  const rows = await db.query.jtvGuangzhoubeiBarcodeTable.findMany({
    where: sql.between(
      schema.jtvGuangzhoubeiBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate),
    ),
    offset: params.pageIndex * params.pageSize,
    limit: params.pageSize,
  });
  return { rows, count };
};

const sqlite_delete = async (id: number) => {
  const [result] = await db
    .delete(schema.jtvGuangzhoubeiBarcodeTable)
    .where(sql.eq(schema.jtvGuangzhoubeiBarcodeTable.id, id))
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
  const host = jtv_hmis_guangzhoubei.get("get_host");
  const unitCode = jtv_hmis_guangzhoubei.get("unitCode");
  const url = new URL(`http://${host}/api/getData`);
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", [barcode, unitCode].join(","));
  log(`请求数据:${url.href}`);
  const res = await net.fetch(url.href, {
    method: "GET",
  });

  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }

  const data = await res.json();

  log(`返回数据:${JSON.stringify(data)}`);
  return data as GetResponse;
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
  const host = jtv_hmis_guangzhoubei.get("post_host");
  const url = new URL(`http://${host}/pmss/example.do`);
  url.searchParams.set("method", "saveData");
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

  await db.insert(schema.jtvGuangzhoubeiBarcodeTable).values({
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
  const record = await db.query.jtvGuangzhoubeiBarcodeTable.findFirst({
    where: sql.eq(schema.jtvGuangzhoubeiBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  const body = await recordToBody(record);
  await fetch_set([body]);
  const [result] = await db
    .update(schema.jtvGuangzhoubeiBarcodeTable)
    .set({ isUploaded: true })
    .where(sql.eq(schema.jtvGuangzhoubeiBarcodeTable.id, record.id))
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
  const delay = jtv_hmis_guangzhoubei.get("autoUploadInterval") * 1000;
  timer = setTimeout(autoUploadHandler, delay);

  const barcodes = await db.query.jtvGuangzhoubeiBarcodeTable.findMany({
    where: sql.and(
      sql.eq(schema.jtvGuangzhoubeiBarcodeTable.isUploaded, false),
      sql.between(
        schema.jtvGuangzhoubeiBarcodeTable.date,
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
  if (jtv_hmis_guangzhoubei.get("autoUpload")) {
    autoUploadHandler();
  }

  jtv_hmis_guangzhoubei.onDidChange("autoUpload", (value) => {
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
  ipcHandle(
    channel.jtv_hmis_guangzhoubei_sqlite_get,
    (_, params: SQLiteGetParams) => sqlite_get(params),
  );
  ipcHandle(channel.jtv_hmis_guangzhoubei_sqlite_delete, (_, id: number) =>
    sqlite_delete(id),
  );
  ipcHandle(channel.jtv_hmis_guangzhoubei_api_get, (_, barcode: string) =>
    api_get(barcode),
  );
  ipcHandle(channel.jtv_hmis_guangzhoubei_api_set, (_, id: number) =>
    api_set(id),
  );

  ipcHandle(
    channel.jtv_hmis_guangzhoubei_setting,
    (_, data?: JTV_HMIS_Guangzhoubei) => {
      if (data) {
        jtv_hmis_guangzhoubei.set(data);
      }
      return jtv_hmis_guangzhoubei.store;
    },
  );
};

export const init = () => {
  initIpc();
  initAutoUpload();
};
