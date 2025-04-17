// 京天威 徐州北

import { net } from "electron";
import {
  getCorporation,
  getDetectionByZH,
  getDetectionDatasByOPID,
  log,
  getPlace,
  getDirection,
  createEmit,
} from "./lib";
import dayjs from "dayjs";
import { URL } from "node:url";
import Store from "electron-store";
import { db } from "./db";
import * as sql from "drizzle-orm";
import * as schema from "./schema";
import * as channel from "./channel";

export type JTV_HMIS_XUZHOUBEI = {
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
  username_prefix: string;
};

export const jtv_hmis_xuzhoubei = new Store<JTV_HMIS_XUZHOUBEI>({
  name: "jtv_hmis_xuzhoubei",
  schema: {
    host: {
      type: "string",
      default: "",
    },
    autoInput: {
      type: "boolean",
      default: false,
    },
    autoUpload: {
      type: "boolean",
      default: false,
    },
    autoUploadInterval: {
      type: "number",
      default: 30,
    },
    username_prefix: {
      type: "string",
      default: "",
    },
  },
});

export const emit = createEmit(channel.jtvXuzhoubeiBarcodeEmit);

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
  },
];

export const getFn = async (barCode: string) => {
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

export type PostRequestItem = {
  PJ_JXID: string; // 设备生产ID(主键)
  SB_SN: string; // 设备编号
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
  XHCZ: string; // 卸荷槽左(人员签名)
  XHCY: string; // 卸荷槽右(人员签名)
  LW_TFLAW_PLACE: string; // 缺陷部位
  LW_TFLAW_TYPE: string; // 缺陷类型
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

export const postFn = async (request: PostRequestItem) => {
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

export const uploadBarcode = async (id: number) => {
  const hmis = jtv_hmis_xuzhoubei.store;
  const record = await db.query.jtvXuzhoubeiBarcodeTable.findFirst({
    where: sql.eq(schema.jtvXuzhoubeiBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }

  const startDate = dayjs(record.date).startOf("day").toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();
  const corporation = await getCorporation();
  const detection = await getDetectionByZH({
    zh: record.zh,
    startDate,
    endDate,
  });

  const SB_SN = corporation.DeviceNO || "";
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
    XHCZ: user, // 卸荷槽左(人员签名)
    XHCY: user, // 卸荷槽右(人员签名)
    LW_TFLAW_PLACE: "", // 缺陷部位
    LW_TFLAW_TYPE: "", // 缺陷类型
    LW_TVIEW: "", // 处理意见
    PJ_SCZZRQ: formatDate(record.PJ_SCZZRQ), // 首次组装日期
    PJ_SCZZDW: record.PJ_SCZZDW || "", // 首次组装单位
    PJ_MCZZRQ: formatDate(record.PJ_MCZZRQ), // 末次组装日期
    PJ_MCZZDW: record.PJ_MCZZDW || "", // 末次组装单位
    LW_CZCTZ: user, // 左穿透
    LW_CZCTY: user, // 右穿透
    LW_LZXRBZ: user, // 左轮座
    LW_LZXRBY: user, // 右轮座
    LW_XHCZ: user, // 左轴颈
    LW_XHCY: user, // 右轴颈
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

    body.LW_TVIEW = "人工复探";
    body.LW_TFLAW_TYPE = "裂纹";
  }

  await postFn(body);
  await db
    .update(schema.jtvXuzhoubeiBarcodeTable)
    .set({
      isUploaded: true,
    })
    .where(sql.eq(schema.jtvXuzhoubeiBarcodeTable.id, id));
  emit();
};
