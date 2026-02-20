// 京天威 统型

import dayjs from "dayjs";
import { net } from "electron";
import * as sql from "drizzle-orm";
import { getIP, createEmit } from "#main/lib";
import { log, withLog, ipcHandle } from "#main/lib/ipc";
import * as schema from "#main/schema";
import type { JTV_HMIS } from "#main/lib/store";
import type { Detection, DetectionData } from "#main/modules/mdb";
import type { AppContext } from "#main/index";
import type { SQLiteGetParams, InsertRecordParams } from "#main/lib/ipc";

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

type ZH_Response = {
  code: string;
  msg: string;
  data: ZH_Item[];
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

  SRYY?: string | null;
  SRDW?: string | null;
};

type DH_Response = {
  code: string;
  msg: string;
  data: DH_Item[];
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

const handleReadRecords = async (
  appContext: AppContext,
  params: SQLiteGetParams,
) => {
  const { sqliteDB: db } = appContext;

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

const handleDeleteRecord = async (appContext: AppContext, id: number) => {
  const { sqliteDB: db } = appContext;
  const [result] = await db
    .delete(schema.jtvBarcodeTable)
    .where(sql.eq(schema.jtvBarcodeTable.id, id))
    .returning();

  emit();

  return result;
};

const handleInsertRecord = async (
  appContext: AppContext,
  data: InsertRecordParams,
) => {
  const { sqliteDB: db } = appContext;
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

const makeDataRequestURL = (appContext: AppContext, dh: string) => {
  const { jtv_hmis } = appContext;
  const host = jtv_hmis.get("host");
  const unitCode = jtv_hmis.get("unitCode");
  const url = new URL(`http://${host}/api/getData`);

  url.searchParams.set("param", [dh, unitCode].join(","));

  return url;
};

const fetchAxleInfoByZH = async (appContext: AppContext, zh: string) => {
  const url = makeDataRequestURL(appContext, zh);

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

const fetchAxleInfoByDH = async (appContext: AppContext, dh: string) => {
  const url = makeDataRequestURL(appContext, dh);

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

const normalizeResponse = async (
  appContext: AppContext,
  barCode: string,
  isZhMode?: boolean,
) => {
  if (isZhMode) {
    const data = await fetchAxleInfoByZH(appContext, barCode);
    const result = normalizeZHResponse(data);

    return result;
  } else {
    const data = await fetchAxleInfoByDH(appContext, barCode);
    const result = normalizeDHResponse(data);

    return result;
  }
};

const handleFetchRecord = async (
  appContext: AppContext,
  barcode: string,
  isZhMode?: boolean,
) => {
  const data = await normalizeResponse(appContext, barcode, isZhMode);

  return data;
};

const sendPostRequest = async (appContext: AppContext, request: PostItem[]) => {
  const { jtv_hmis } = appContext;
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
  appContext: AppContext,
  eq_ip: string,
  eq_bh: string,
  record: schema.JTVBarcode,
  detection: Detection,
  detectionData?: DetectionData,
): PostItem => {
  const { jtv_hmis } = appContext;
  const user = detection.szUsername || "";
  const signature_prefix = jtv_hmis.get("signature_prefix");
  const signature = signature_prefix + user;

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
    CZCTZ: signature,
    CZCTY: signature,
    LZXRBZ: signature,
    LZXRBY: signature,
    XHCZ: detection.bWheelLS ? signature : "",
    XHCY: detection.bWheelRS ? signature : "",
    TSZ: signature,
    TSZY: signature,
    CT_RESULT: detection.szResult || "",
  };
};

const recordToBody = async (
  appContext: AppContext,
  record: schema.JTVBarcode,
): Promise<PostItem[]> => {
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

  const { mdbDB } = appContext;

  const corporation = await mdbDB.getCorporation();
  const eq_bh = corporation.DeviceNO || "";
  const eq_ip = getIP();
  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();

  const detection = await mdbDB.getDetectionForJTV({
    zh: record.zh,
    startDate,
    endDate,
    CZZZDW: record.CZZZDW || "",
    CZZZRQ: record.CZZZRQ || "",
  });

  let detectionDatas: DetectionData[] = [];

  switch (detection.szResult) {
    case "故障":
    case "有故障":
    case "疑似故障":
      detectionDatas = await mdbDB.getDetectionDatasByOPID(detection.szIDs);
      break;
    default:
  }

  if (detectionDatas.length === 0) {
    return [makePostItem(appContext, eq_ip, eq_bh, record, detection)];
  }

  return detectionDatas.map((detectionData) => {
    return makePostItem(
      appContext,
      eq_ip,
      eq_bh,
      record,
      detection,
      detectionData,
    );
  });
};

const emit = createEmit("api_set");

const handleSendData = async (
  appContext: AppContext,
  id: number,
): Promise<schema.JTVBarcode> => {
  const { sqliteDB: db } = appContext;
  const record = await db.query.jtvBarcodeTable.findFirst({
    where: sql.eq(schema.jtvBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  const body = await recordToBody(appContext, record);
  await sendPostRequest(appContext, body);

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
let timer: number | null = null;

const autoUploadHandler = async (appContext: AppContext) => {
  const { jtv_hmis, sqliteDB: db } = appContext;
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
    await doTask(appContext, barcode.id).catch(Boolean);
  }
};

const initAutoUpload = (appContext: AppContext) => {
  const { jtv_hmis } = appContext;

  if (jtv_hmis.get("autoUpload")) {
    autoUploadHandler(appContext);
  }

  jtv_hmis.onDidChange("autoUpload", (value) => {
    if (value) {
      autoUploadHandler(appContext);
      return;
    }

    if (!timer) return;
    clearTimeout(timer);
  });
};

const handleHMISSetting = async (
  appContext: AppContext,
  data?: Partial<JTV_HMIS>,
) => {
  const { jtv_hmis } = appContext;

  if (data) {
    jtv_hmis.set(data);
  }
  return jtv_hmis.store;
};

export const bindIpcHandlers = (appContext: AppContext) => {
  ipcHandle("HMIS/jtv_hmis_sqlite_get", (_, params) => {
    return handleReadRecords(appContext, params);
  });
  ipcHandle("HMIS/jtv_hmis_sqlite_delete", (_, id) => {
    return handleDeleteRecord(appContext, id);
  });
  ipcHandle("HMIS/jtv_hmis_sqlite_insert", (_, data) => {
    return handleInsertRecord(appContext, data);
  });
  ipcHandle("HMIS/jtv_hmis_api_get", (_, dh, isZhMode) => {
    return handleFetchRecord(appContext, dh, isZhMode);
  });
  ipcHandle("HMIS/jtv_hmis_api_set", (_, id) => {
    return handleSendData(appContext, id);
  });
  ipcHandle("HMIS/jtv_hmis_setting", (_, data) => {
    return handleHMISSetting(appContext, data);
  });
  initAutoUpload(appContext);
};
