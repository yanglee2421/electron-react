// 京天威 徐州北

import { net } from "electron";
import { log, getDirection, withLog, createEmit, ipcHandle } from "./lib";
import {
  getCorporation,
  getDetectionByZH,
  getDetectionDatasByOPID,
} from "./cmd";
import dayjs from "dayjs";
import { URL } from "node:url";
import { jtv_hmis_xuzhoubei } from "./store";
import { db } from "./db";
import * as sql from "drizzle-orm";
import * as schema from "./schema";
import { channel } from "./channel";
import type * as PRELOAD from "~/index";

/*
 * SQLite barcode
 */
const sqlite_get = async (
  params: PRELOAD.JtvXuzhoubeiBarcodeGetParams,
): Promise<PRELOAD.JtvXuzhoubeiBarcodeGetResult> => {
  const [{ count }] = await db
    .select({ count: sql.count() })
    .from(schema.jtvXuzhoubeiBarcodeTable)
    .where(
      sql.between(
        schema.jtvXuzhoubeiBarcodeTable.date,
        new Date(params.startDate),
        new Date(params.endDate),
      ),
    )
    .limit(1);
  const rows = await db.query.jtvXuzhoubeiBarcodeTable.findMany({
    where: sql.between(
      schema.jtvXuzhoubeiBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate),
    ),
    offset: params.pageIndex * params.pageSize,
    limit: params.pageSize,
  });
  return { rows, count };
};

const sqlite_delete = async (
  id: number,
): Promise<schema.JtvXuzhoubeiBarcode> => {
  const [result] = await db
    .delete(schema.jtvXuzhoubeiBarcodeTable)
    .where(sql.eq(schema.jtvXuzhoubeiBarcodeTable.id, id))
    .returning();
  return result;
};

/**
 * HMIS API
 */
export type GetResponse = [
  {
    SCZZRQ: "1990-10-19";
    DH: "50409100225";
    SRDW: "504";
    CZZZRQ: "1990-10-01";
    MCZZDW: "921";
    SRRQ: "2009-10-09";
    SRYY: "01";
    CZZZDW: "183";
    MCZZRQ: "2007-05-18";
    ZH: "18426";
    ZX: "RD2";
    SCZZDW: "183";
    ZTX?: null | string;
    YTX?: null | string;
  },
];

const fetch_get = async (barCode: string) => {
  const host = jtv_hmis_xuzhoubei.get("host");
  const url = new URL(`http://${host}/pmss/vjkxx.do`);
  url.searchParams.set("method", "getData");
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", barCode);
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
  PJ_JXID: string; // 设备生产ID(主键)
  SB_SN: string | null; // 设备编号
  PJ_TAG: string; // 设备工作状态(开始检修1/结束检修0检修前后更新此标志)
  PJ_ZH: string; // 轴号
  PJ_XH: string; // 轴型
  PJ_ZZRQ: string; // 制造日期
  PJ_ZZDW: string; // 制造单位
  PJ_SN: string; // 从HMIS获取的唯一ID(记录流水号)
  PJ_JXRQ: string; // 检修日期(最近更新PJ_TAG的时间)
  CZCTZ: string; // 车轴穿透左(人员签名)
  CZCTY: string; // 车轴穿透右(人员签名)
  LZXRBZ: string; // 轮座镶入部左(人员签名)
  LZXRBY: string; // 轮座镶入部右(人员签名)
  XHCZ: string | null; // 卸荷槽左(人员签名)
  XHCY: string | null; // 卸荷槽右(人员签名)
  LW_TFLAW_PLACE: string | null; // 缺陷部位
  LW_TFLAW_TYPE: string | null; // 缺陷类型
  LW_TVIEW: string; // 处理意见
  PJ_SCZZRQ: string; // 首次组装日期
  PJ_SCZZDW: string; // 首次组装单位
  PJ_MCZZRQ: string; // 末次组装日期
  PJ_MCZZDW: string; // 末次组装单位
  LW_CZCTZ: string; // 左穿透
  LW_CZCTY: string; // 右穿透
  LW_LZXRBZ: string; // 左轮座
  LW_LZXRBY: string; // 右轮座
  LW_XHCZ: string; // 左轴颈
  LW_XHCY: string; // 右轴颈
};

const fetch_set = async (request: PostRequestItem) => {
  const host = jtv_hmis_xuzhoubei.get("host");
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
  const data: boolean = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (!data) {
    throw `接口异常${data}`;
  }
  return data;
};

const formatDate = (date: string | null) =>
  dayjs(date).format("YYYY-MM-DD HH:mm:ss");

const hasQX = (result: string | null) => {
  switch (result) {
    case "故障":
    case "有故障":
    case "疑似故障":
      return true;
    default:
      return false;
  }
};

/**
 * Ipc handlers
 */
const api_get = async (barCode: string): Promise<GetResponse> => {
  const data = await fetch_get(barCode);

  await db.insert(schema.jtvXuzhoubeiBarcodeTable).values({
    barCode: barCode,
    zh: data[0].ZH,
    date: new Date(),
    isUploaded: false,
    PJ_ZZRQ: data[0].CZZZRQ,
    PJ_ZZDW: data[0].CZZZDW,
    PJ_SCZZRQ: data[0].SCZZRQ,
    PJ_SCZZDW: data[0].SCZZDW,
    PJ_MCZZRQ: data[0].MCZZRQ,
    PJ_MCZZDW: data[0].MCZZDW,
  });

  return data;
};

const getPlace = (nChannel: number) => {
  //channel：0.穿透 1~2.轴颈 3~8.轮座
  switch (nChannel) {
    case 0:
      return "穿透";
    case 1:
    case 2:
      return "轴颈";
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

const recordToBody = async (
  record: schema.JtvXuzhoubeiBarcode,
): Promise<PostRequestItem> => {
  if (!record.zh) {
    throw new Error(`记录轴号不存在`);
  }

  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();
  const corporation = await getCorporation();
  const detection = await getDetectionByZH({
    zh: record.zh,
    startDate,
    endDate,
  });

  const SB_SN = corporation.DeviceNO || "";
  const hmis = jtv_hmis_xuzhoubei.store;
  const usernameInDB = detection.szUsername || "";
  const user = [hmis.username_prefix, usernameInDB].join("");

  const body: PostRequestItem = {
    PJ_JXID: detection.szIDs,
    SB_SN,
    PJ_TAG: "0", // 设备工作状态(开始检修1/结束检修0检修前后更新此标志)
    PJ_ZH: record.zh, // 轴号
    PJ_XH: detection.szWHModel || "", // 轴型
    PJ_ZZRQ: record.PJ_ZZRQ || "", // 制造日期
    PJ_ZZDW: record.PJ_ZZDW || "", // 制造单位
    PJ_SN: record.barCode || "", // 从HMIS获取的唯一ID(记录流水号)
    PJ_JXRQ: formatDate(detection.tmnow), // 检修日期(最近更新PJ_TAG的时间)
    CZCTZ: user, // 车轴穿透左(人员签名)
    CZCTY: user, // 车轴穿透右(人员签名)
    LZXRBZ: user, // 轮座镶入部左(人员签名)
    LZXRBY: user, // 轮座镶入部右(人员签名)
    XHCZ: detection.bWheelLS ? user : null, // 卸荷槽左(人员签名)
    XHCY: detection.bWheelRS ? user : null, // 卸荷槽右(人员签名)
    LW_TFLAW_PLACE: null, // 缺陷部位
    LW_TFLAW_TYPE: null, // 缺陷类型
    LW_TVIEW: "良好", // 处理意见
    PJ_SCZZRQ: formatDate(record.PJ_SCZZRQ), // 首次组装日期
    PJ_SCZZDW: record.PJ_SCZZDW || "", // 首次组装单位
    PJ_MCZZRQ: formatDate(record.PJ_MCZZRQ), // 末次组装日期
    PJ_MCZZDW: record.PJ_MCZZDW || "", // 末次组装单位
    LW_CZCTZ: "正常", // 左穿透
    LW_CZCTY: "正常", // 右穿透
    LW_LZXRBZ: "正常", // 左轮座
    LW_LZXRBY: "正常", // 右轮座
    LW_XHCZ: "正常", // 左轴颈
    LW_XHCY: "正常", // 右轴颈
  };

  const hasQx = hasQX(detection.szResult);

  if (hasQx) {
    const detectionDatas = await getDetectionDatasByOPID(detection.szIDs);

    if (detectionDatas.length === 0) {
      body.LW_TFLAW_PLACE = "车轴";
    } else {
      body.LW_TFLAW_PLACE = detectionDatas
        .reduce<string[]>((result, detectionData) => {
          const direction = getDirection(detectionData.nBoard);
          const place = getPlace(detectionData.nChannel);
          result.push(`${place}${direction}`);
          return result;
        }, [])
        .join(",");
    }

    body.LW_TVIEW = "疑似裂纹";
    body.LW_TFLAW_TYPE = "横裂纹";
  }

  return body;
};

const emit = createEmit(channel.jtv_hmis_xuzhoubei_api_set);

const api_set = async (id: number): Promise<schema.JtvXuzhoubeiBarcode> => {
  const record = await db.query.jtvXuzhoubeiBarcodeTable.findFirst({
    where: sql.eq(schema.jtvXuzhoubeiBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }

  const body = await recordToBody(record);

  await fetch_set(body);
  const [result] = await db
    .update(schema.jtvXuzhoubeiBarcodeTable)
    .set({
      isUploaded: true,
    })
    .where(sql.eq(schema.jtvXuzhoubeiBarcodeTable.id, id))
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
  const delay = jtv_hmis_xuzhoubei.get("autoUploadInterval") * 1000;
  timer = setTimeout(autoUploadHandler, delay);

  const barcodes = await db.query.jtvXuzhoubeiBarcodeTable.findMany({
    where: sql.and(
      sql.eq(schema.jtvXuzhoubeiBarcodeTable.isUploaded, false),
      sql.between(
        schema.jtvXuzhoubeiBarcodeTable.date,
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
  if (jtv_hmis_xuzhoubei.get("autoUpload")) {
    autoUploadHandler();
  }

  jtv_hmis_xuzhoubei.onDidChange("autoUpload", (value) => {
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
    channel.jtv_hmis_xuzhoubei_sqlite_get,
    (_, params: PRELOAD.JtvXuzhoubeiBarcodeGetParams) => sqlite_get(params),
  );

  ipcHandle(channel.jtv_hmis_xuzhoubei_sqlite_delete, (_, id: number) =>
    sqlite_delete(id),
  );

  ipcHandle(channel.jtv_hmis_xuzhoubei_api_get, (_, barcode: string) =>
    api_get(barcode),
  );

  ipcHandle(channel.jtv_hmis_xuzhoubei_api_set, (_, id: number) => api_set(id));

  ipcHandle(
    channel.jtv_hmis_xuzhoubei_setting,
    (_, data?: PRELOAD.JtvHmisXuzhoubeiSettingParams) => {
      if (data) {
        jtv_hmis_xuzhoubei.set(data);
      }
      return jtv_hmis_xuzhoubei.store;
    },
  );
};

export const init = () => {
  initIpc();
  initAutoUpload();
};
