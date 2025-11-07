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
const handleReadRecords = async (
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

const handleDeleteRecord = async (id: number): Promise<schema.JTVBarcode> => {
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
      DH: "91022070168";
      ZH: "67444";
      ZX: "RE2B";
      CZZZDW: "048";
      CZZZRQ: "2009-10";
      MCZZDW: "131";
      MCZZRQ: "2018-07-09 00:00:00";
      SCZZDW: "131";
      SCZZRQ: "2018-07-09 00:00:00";

      SRYY: "厂修";
      SRDW: "588";
    },
  ];
};

const fetchDataByDH = async (barcode: string) => {
  const host = jtv_hmis.get("host");
  const unitCode = jtv_hmis.get("unitCode");
  const url = new URL(`http://${host}/api/getData`);

  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", [barcode, unitCode].join(","));
  log(`请求数据:${url.href}`);

  const res = await net.fetch(url.href, { method: "GET" });

  if (!res.ok) {
    throw new Error(`接口异常[${res.status}]:${res.statusText}`);
  }

  const data: GetResponse = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);

  if (data.code !== "200") {
    throw new Error(data.msg);
  }

  return data;
};

const normalizeDHResponse = (data: GetResponse) => {
  const firstRecord = data.data.at(0);

  if (!firstRecord) {
    throw new Error("返回空记录");
  }

  return {
    DH: firstRecord.DH,
    ZH: firstRecord.ZH,
    ZX: firstRecord.ZX,
    CZZZDW: firstRecord.CZZZDW,
    CZZZRQ: firstRecord.CZZZRQ,
    MCZZDW: firstRecord.MCZZDW,
    MCZZRQ: firstRecord.MCZZRQ,
    SCZZDW: firstRecord.SCZZDW,
    SCZZRQ: firstRecord.SCZZRQ,
  };
};

const handleGetRequest = async (barcode: string): Promise<GetResponse> => {
  const data = await fetchDataByDH(barcode);
  const firstRecord = normalizeDHResponse(data);

  await db.insert(schema.jtvBarcodeTable).values({
    barCode: firstRecord.DH,
    zh: firstRecord.ZH,
    date: new Date(),
    isUploaded: false,
  });

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
  record: schema.JTVGuangzhoubeiBarcode,
  detection: Detection,
  detectionData: DetectionData,
  eq_ip: string,
  eq_bh: string,
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
    TFLAW_PLACE: detectionDataToTPlace(detectionData),
    TFLAW_TYPE: "裂纹",
    TVIEW: "人工复探",
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

const recordToBody = async (
  record: schema.JTVGuangzhoubeiBarcode,
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
    const user = detection.szUsername || "";

    return [
      {
        eq_ip,
        eq_bh,
        dh: record.barCode || "",
        zh: record.zh || "",
        zx: detection.szWHModel || "",
        TSFF: "超声波",
        TSSJ: tmnowToTSSJ(detection.tmnow || ""),
        TFLAW_PLACE: "",
        TFLAW_TYPE: "",
        TVIEW: "",
        CZCTZ: user,
        CZCTY: user,
        LZXRBZ: user,
        LZXRBY: user,
        XHCZ: user,
        XHCY: user,
        TSZ: user,
        TSZY: user,
        CT_RESULT: detection.szResult || "",
      },
    ];
  }

  return detectionDatas.map((detectionData) => {
    return makePostItem(record, detection, detectionData, eq_ip, eq_bh);
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
    (_, params: PRELOAD.JtvBarcodeGetParams) => handleReadRecords(params),
  );
  ipcHandle(channel.jtv_hmis_sqlite_delete, (_, id: number) =>
    handleDeleteRecord(id),
  );
  ipcHandle(channel.jtv_hmis_api_get, (_, barcode: string) =>
    handleGetRequest(barcode),
  );
  ipcHandle(channel.jtv_hmis_api_set, (_, id: number) => handleSendData(id));

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
