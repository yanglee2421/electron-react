// 康华 安康

import { net } from "electron";
import {
  getDetectionDatasByOPID,
  getDetectionByZH,
  log,
  getCorporation,
  createEmit,
} from "./lib";
import dayjs from "dayjs";
import { URL } from "node:url";
import Store from "electron-store";
import { db } from "./db";
import * as sql from "drizzle-orm";
import * as schema from "./schema";
import * as channel from "./channel";

export type KH_HMIS = {
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
  tsgz: string;
  tszjy: string;
  tsysy: string;
};

export const kh_hmis = new Store<KH_HMIS>({
  name: "kh_hmis",
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
    tsgz: {
      type: "string",
      default: "",
    },
    tszjy: {
      type: "string",
      default: "",
    },
    tsysy: {
      type: "string",
      default: "",
    },
  },
});

export const emit = createEmit(channel.khBarcodeEmit);

export type GetResponse = {
  data: {
    mesureId: "A23051641563052";
    zh: "10911";
    zx: "RE2B";
    clbjLeft: "HEZD Ⅱ 18264";
    clbjRight: "HEZD Ⅱ 32744";
    czzzrq: "2003-01-16";
    czzzdw: "673";
    ldszrq: "2014-06-22";
    ldszdw: "673";
    ldmzrq: "2018-04-13";
    ldmzdw: "623";
  };
  code: 200;
  msg: "success";
};

export const getFn = async (barCode: string) => {
  const host = kh_hmis.get("host");
  const url = new URL(`http://${host}/api/lzdx_csbtsj_get/get`);
  const body = JSON.stringify({
    mesureId: barCode,
  });
  log(`请求数据[${url.href}]:${body}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data: GetResponse = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (data.code !== 200) {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};

type PostRequestItem = {
  mesureId?: string;
  ZH: string;
  ZCTJG: string;
  ZZJJG: string;
  ZLZJG: string;
  YCTJG: string;
  YZJJG: string;
  YLZJG: string;
  JCJG: string;
  BZ?: string;
  TSRY: string;
  JCSJ: string;
  sbbh: string;
};

type PostResponse = {
  code: 200;
  msg: "success";
};

const postFn = async (params: PostRequestItem) => {
  const host = kh_hmis.get("host");
  const url = new URL(`http://${host}/api/lzdx_csbtsj_tsjg/save`);
  const body = JSON.stringify(params);
  log(`请求数据[${url.href}]:${body}`);
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
  if (data.code !== 200) {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};

type QXDataParams = {
  mesureid: string;
  zh: string;
  testdatetime: string;
  testtype: "超声波";
  btcw: string;
  tsr: string;
  tsgz: string;
  tszjy: string;
  tsysy: string;
  gzmc: "裂纹";
  clff: "人工复探";
  qxlzzdmjlnc?: string;
  qxlzzdmjlwc?: string;
  qxlzydmjlnc?: string;
  qxlzydmjlwc?: string;
  qxlzzlwcnc?: string;
  qxlzzlwcwc?: string;
  qxlzylwcnc?: string;
  qxlzylwcwc?: string;
  qxlzzlwsnc?: string;
  qxlzzlwswc?: string;
  qxlzylwsnc?: string;
  qxlzylwswc?: string;
  qxzjzdmjlzj?: string;
  qxzjzdmjlzs?: string;
  qxzjydmjlzj?: string;
  qxzjydmjlzs?: string;
  qxzjzlwczj?: string;
  qxzjzlwczs?: string;
  qxzjylwczj?: string;
  qxzjylwczs?: string;
  qxzjzlwszj?: string;
  qxzjzlwszs?: string;
  qxzjylwszj?: string;
  qxzjylwszs?: string;
  qxclzlwcz?: string;
  qxclzlwcy?: string;
  qxclylwcz?: string;
  qxclylwcy?: string;
  bz: "";
};

const saveQXData = async (params: QXDataParams) => {
  const host = kh_hmis.get("host");
  const url = new URL(`http://${host}/api/lzdx_csbtsj_whzy_tsjgqx/save`);
  const body = JSON.stringify(params);
  log(`请求数据[${url.href}]:${body}`);
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
  if (data.code !== 200) {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};

export const upload = async (id: number) => {
  const record = await db.query.khBarcodeTable.findFirst({
    where: sql.eq(schema.khBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }

  if (!record.barCode) {
    throw new Error(`记录#${id}条形码不存在`);
  }

  const startDate = dayjs(record.date).startOf("day").toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();
  const corporation = await getCorporation();

  const detection = await getDetectionByZH({
    zh: record.zh,
    startDate,
    endDate,
  });

  const JCJG = detection.szResult === "合格" ? "1" : "0";
  const hmis = kh_hmis.store;

  const basicBody: PostRequestItem = {
    mesureId: record.barCode,
    ZH: record.zh,
    // 1 探伤 0 不探伤
    ZCTJG: "1",
    ZZJJG: "1",
    ZLZJG: "1",
    YCTJG: "1",
    YZJJG: "1",
    YLZJG: "1",
    JCJG,
    BZ: "",
    TSRY: detection.szUsername || "",
    JCSJ: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
    sbbh: corporation.DeviceNO || "",
  };

  await postFn(basicBody);

  if (JCJG === "1") return;

  await getDetectionDatasByOPID(detection.szIDs);

  const qxBody: QXDataParams = {
    mesureid: record.barCode,
    zh: record.zh,
    testdatetime: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
    testtype: "超声波",
    btcw: "车轴",
    tsr: detection.szUsername || "",
    tsgz: hmis.tsgz,
    tszjy: hmis.tszjy,
    tsysy: hmis.tsysy,
    gzmc: "裂纹",
    clff: "人工复探",
    // qxlzzdmjlnc: "",
    // qxlzzdmjlwc: "",
    // qxlzydmjlnc: "",
    // qxlzydmjlwc: "",
    // qxlzzlwcnc: "",
    // qxlzzlwcwc: "",
    // qxlzylwcnc: "",
    // qxlzylwcwc: "",
    // qxlzzlwsnc: "",
    // qxlzzlwswc: "",
    // qxlzylwsnc: "",
    // qxlzylwswc: "",
    // qxzjzdmjlzj: "",
    // qxzjzdmjlzs: "",
    // qxzjydmjlzj: "",
    // qxzjydmjlzs: "",
    // qxzjzlwczj: "",
    // qxzjzlwczs: "",
    // qxzjylwczj: "",
    // qxzjylwczs: "",
    // qxzjzlwszj: "",
    // qxzjzlwszs: "",
    // qxzjylwszj: "",
    // qxzjylwszs: "",
    // qxclzlwcz: "0",
    // qxclzlwcy: "0",
    // qxclylwcz: "0",
    // qxclylwcy: "0",
    bz: "",
  };

  await saveQXData(qxBody);
};

export const uploadBarcode = async (id: number) => {
  await upload(id);
  await db
    .update(schema.khBarcodeTable)
    .set({ isUploaded: true })
    .where(sql.eq(schema.khBarcodeTable.id, id));
  emit();
};
