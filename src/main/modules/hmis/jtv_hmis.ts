// 京天威 统型

import dayjs from "dayjs";
import { net } from "electron";
import * as sql from "drizzle-orm";
import { log, withLog, ipcHandle, db, getIP, createEmit } from "#main/lib";
import * as schema from "#main/schema";
import { channel } from "#main/channel";
import { jtv_hmis } from "#main/lib/store";
import {
  getCorporation,
  getDetectionByZH,
  getDetectionDatasByOPID,
} from "#main/modules/cmd";
import type { Detection, DetectionData } from "#main/modules/cmd";
import type * as PRELOAD from "#preload/index";

/**
 * Sqlite barcode
 */
type SQLiteGetParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

const handleReadRecords = async (params: SQLiteGetParams) => {
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
    orderBy: sql.desc(schema.jtvBarcodeTable.date),
  });

  return { rows, count };
};

const handleDeleteRecord = async (id: number) => {
  const [result] = await db
    .delete(schema.jtvBarcodeTable)
    .where(sql.eq(schema.jtvBarcodeTable.id, id))
    .returning();

  emit();

  return result;
};

export type InsertRecordParams = {
  DH: string;
  ZH: string;
};

const handleInsertRecord = async (data: InsertRecordParams) => {
  const [result] = await db
    .insert(schema.jtvBarcodeTable)
    .values({
      barCode: data.DH,
      zh: data.ZH,
      date: new Date(),
      isUploaded: false,
    })
    .returning();

  emit();

  return result;
};

const makeDataRequestURL = (dh: string) => {
  const host = jtv_hmis.get("host");
  const unitCode = jtv_hmis.get("unitCode");
  const url = new URL(`http://${host}/api/getData`);

  url.searchParams.set("param", [dh, unitCode].join(","));

  return url;
};

type ZH_Item = {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZRQ: string;
  CZZZDW: string;
  SCZZRQ: string;
  SCZZDW: string;
  MCZZRQ: string;
  MCZZDW: string;
  SRRQ: string;

  LBZGZPH: string | null;
  CLLWKSRZ: number | null;
  CLLWKSRY: number | null;
  PJ_ID: string | null;
  LBYGZPH: string | null;
  LBYLH: string | null;
  LBZCDH: string | null;
  LBYLX: string | null;
  CLLWHSRY: number | null;
  CLLWHSRZ: number | null;
  LBZSXH: string | null;
  CLZJSRY: number | null;
  CLZJSRZ: number | null;
  LBYZZRQ: string | null;
  LBZLH: string | null;
  LBZZZRQ: string | null;
  LBYSXH: string | null;
  LBZLX: string | null;
  LBYCDH: string | null;
};

export type ZH_Response = {
  code: string;
  msg: string;
  data: ZH_Item[];
};

const fetchAxleInfoByZH = async (zh: string) => {
  const url = makeDataRequestURL(zh);

  url.searchParams.set("type", "csbtszh");
  log(`请求轴号数据:${url.href}`);

  const res = await net.fetch(url.href, { method: "GET" });

  if (!res.ok) {
    throw new Error(`接口异常[${res.status}]:${res.statusText}`);
  }

  const data: ZH_Response = await res.json();
  log(`返回轴号数据:${JSON.stringify(data)}`);

  if (data.code !== "200") {
    throw new Error(data.msg);
  }

  return data;
};

const normalizeZHResponse = (data: ZH_Response) => {
  if (data.code !== "200") {
    throw new Error(data.msg);
  }

  return data.data.map((record) => {
    return {
      DH: record.DH,
      ZH: record.ZH,
      ZX: record.ZX,
      CZZZDW: record.CZZZDW,
      CZZZRQ: record.CZZZRQ,
      MCZZDW: record.MCZZDW,
      MCZZRQ: record.MCZZRQ,
      SCZZDW: record.SCZZDW,
      SCZZRQ: record.SCZZRQ,
    };
  });
};

type DH_Item = {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZDW: string;
  CZZZRQ: string;
  MCZZDW: string;
  MCZZRQ: string;
  SCZZDW: string;
  SCZZRQ: string;
  SRRQ: string;

  SRYY?: string | null;
  SRDW?: string | null;
};

export type DH_Response = {
  code: string;
  msg: string;
  data: DH_Item[];
};

const fetchAxleInfoByDH = async (dh: string) => {
  const url = makeDataRequestURL(dh);

  url.searchParams.set("type", "csbts");
  log(`请求单号数据:${url.href}`);

  const res = await net.fetch(url.href, { method: "GET" });

  if (!res.ok) {
    throw new Error(`接口异常[${res.status}]:${res.statusText}`);
  }

  const data: DH_Response = await res.json();
  log(`返回单号数据:${JSON.stringify(data)}`);

  if (data.code !== "200") {
    throw new Error(data.msg);
  }

  return data;
};

const normalizeDHResponse = (data: DH_Response) => {
  if (data.code !== "200") {
    throw new Error(data.msg);
  }

  return data.data.map((record) => {
    return {
      DH: record.DH,
      ZH: record.ZH,
      ZX: record.ZX,
      CZZZDW: record.CZZZDW,
      CZZZRQ: record.CZZZRQ,
      MCZZDW: record.MCZZDW,
      MCZZRQ: record.MCZZRQ,
      SCZZDW: record.SCZZDW,
      SCZZRQ: record.SCZZRQ,
    };
  });
};

const normalizeResponse = async (barCode: string, isZhMode?: boolean) => {
  if (isZhMode) {
    const data = await fetchAxleInfoByZH(barCode);
    const result = normalizeZHResponse(data);

    return result;
  } else {
    const data = await fetchAxleInfoByDH(barCode);
    const result = normalizeDHResponse(data);

    return result;
  }
};

export type NormalizedResponse = Awaited<ReturnType<typeof normalizeResponse>>;

const handleFetchRecord = async (barcode: string, isZhMode?: boolean) => {
  const data = await normalizeResponse(barcode, isZhMode);

  return data;
};

type PostItem = {
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

const sendPostRequest = async (request: PostItem[]) => {
  const host = jtv_hmis.get("host");
  const url = new URL(`http://${host}/api/saveData`);
  const body = JSON.stringify(request);

  url.searchParams.set("type", "csbts");
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

const nBoardToDirection = (nBoard: number) => {
  //board(板卡)：0.左 1.右
  switch (nBoard) {
    case 1:
      return "右";
    case 0:
      return "左";
    default:
      return "";
  }
};

const nChannelToPlace = (nChannel: number) => {
  switch (nChannel) {
    case 0:
      return "穿透";
    case 1:
    case 2:
      return "卸荷槽";
    case 3:
      return "外";
    case 4:
      return "内";
    case 5:
    case 6:
    case 7:
    case 8:
      return "轮座";
    default:
      return "车轴";
  }
};

const detectionDataToTPlace = (detectionData: DetectionData) => {
  const direction = nBoardToDirection(detectionData.nBoard);
  const place = nChannelToPlace(detectionData.nChannel);

  return direction + place;
};

const tmnowToTSSJ = (tmnow: string) => {
  return dayjs(tmnow).format("YYYY-MM-DD HH:mm:ss");
};

const makePostItem = (
  eq_ip: string,
  eq_bh: string,
  record: schema.JTVBarcode,
  detection: Detection,
  detectionData?: DetectionData,
): PostItem => {
  const user = detection.szUsername || "";

  return {
    eq_ip,
    eq_bh,
    dh: record.barCode || "",
    zh: record.zh || "",
    zx: detection.szWHModel || "",
    TSFF: "超声波",
    TSSJ: tmnowToTSSJ(detection.tmnow || ""),
    TFLAW_PLACE: detectionData ? detectionDataToTPlace(detectionData) : "",
    TFLAW_TYPE: detectionData ? "裂纹" : "",
    TVIEW: detectionData ? "人工复探" : "",
    CZCTZ: user,
    CZCTY: user,
    LZXRBZ: user,
    LZXRBY: user,
    XHCZ: detection.bWheelLS ? user : "",
    XHCY: detection.bWheelRS ? user : "",
    TSZ: user,
    TSZY: user,
    CT_RESULT: detection.szResult || "",
  };
};

const recordToBody = async (record: schema.JTVBarcode): Promise<PostItem[]> => {
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
  const eq_bh = corporation.DeviceNO || "";
  const eq_ip = getIP();
  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();

  const detection = await getDetectionByZH({
    zh: record.zh,
    startDate,
    endDate,
  });

  let detectionDatas: DetectionData[] = [];

  switch (detection.szResult) {
    case "故障":
    case "有故障":
    case "疑似故障":
      detectionDatas = await getDetectionDatasByOPID(detection.szIDs);
      break;
    default:
  }

  if (detectionDatas.length === 0) {
    return [makePostItem(eq_ip, eq_bh, record, detection)];
  }

  return detectionDatas.map((detectionData) => {
    return makePostItem(eq_ip, eq_bh, record, detection, detectionData);
  });
};

const emit = createEmit(channel.jtv_hmis_api_set);

const handleSendData = async (id: number): Promise<schema.JTVBarcode> => {
  const record = await db.query.jtvBarcodeTable.findFirst({
    where: sql.eq(schema.jtvBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  const body = await recordToBody(record);
  await sendPostRequest(body);

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
const doTask = withLog(handleSendData);
let timer: NodeJS.Timeout | null = null;

const autoUploadHandler = async () => {
  const delay = jtv_hmis.get("autoUploadInterval") * 1000;
  timer = setTimeout(autoUploadHandler, delay);

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
  ipcHandle(
    channel.jtv_hmis_sqlite_get,
    (_, params: PRELOAD.JtvBarcodeGetParams) => {
      return handleReadRecords(params);
    },
  );
  ipcHandle(channel.jtv_hmis_sqlite_delete, (_, id: number) => {
    return handleDeleteRecord(id);
  });
  ipcHandle(
    channel.jtv_hmis_sqlite_insert,
    (_, payload: InsertRecordParams) => {
      return handleInsertRecord(payload);
    },
  );
  ipcHandle(
    channel.jtv_hmis_api_get,
    (_, barcode: string, isZhMode?: boolean) => {
      return handleFetchRecord(barcode, isZhMode);
    },
  );
  ipcHandle(channel.jtv_hmis_api_set, (_, id: number) => {
    return handleSendData(id);
  });

  ipcHandle(
    channel.jtv_hmis_setting,
    (_, data?: PRELOAD.JtvHmisSettingParams) => {
      if (data) {
        jtv_hmis.set(data);
      }
      return jtv_hmis.store;
    },
  );
};

export const init = () => {
  initIpc();
  initAutoUpload();
};
