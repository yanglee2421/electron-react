// 康华 安康

import { net } from "electron";
import { createEmit, log, withLog, ipcHandle } from "./lib";
import { getCorporation, getDetectionByZH } from "./cmd";
import dayjs from "dayjs";
import { URL } from "node:url";
import { kh_hmis } from "./store";
import { db } from "./db";
import * as sql from "drizzle-orm";
import * as schema from "./schema";
import { channel } from "./channel";
import type * as PRELOAD from "~/index";

/**
 * Sqlite barcode
 */
const sqlite_get = async (
  params: PRELOAD.KhBarcodeGetParams,
): Promise<PRELOAD.KhBarcodeGetResult> => {
  const [{ count }] = await db
    .select({ count: sql.count() })
    .from(schema.khBarcodeTable)
    .where(
      sql.between(
        schema.khBarcodeTable.date,
        new Date(params.startDate),
        new Date(params.endDate),
      ),
    )
    .limit(1);
  const rows = await db.query.khBarcodeTable.findMany({
    where: sql.between(
      schema.khBarcodeTable.date,
      new Date(params.startDate),
      new Date(params.endDate),
    ),
    offset: params.pageIndex * params.pageSize,
    limit: params.pageSize,
  });
  return { rows, count };
};

const sqlite_delete = async (id: number): Promise<schema.KhBarcode> => {
  const [result] = await db
    .delete(schema.khBarcodeTable)
    .where(sql.eq(schema.khBarcodeTable.id, id))
    .returning();
  return result;
};

/**
 * HMIS API
 */
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

const fetch_get = async (barCode: string) => {
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

const fetch_set = async (params: PostRequestItem) => {
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

/**
 * Ipc handlers
 */
const api_get = async (barCode: string): Promise<GetResponse> => {
  const data = await fetch_get(barCode);

  // 仍然保存到数据库，但不返回数据库记录
  await db
    .insert(schema.khBarcodeTable)
    .values({
      barCode: barCode,
      zh: data.data.zh,
      date: new Date(),
      isUploaded: false,
    })
    .returning();

  return data;
};

const recordToBody = async (record: schema.KhBarcode) => {
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

  return {
    basicBody,
    qxBody: {
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
      bz: "",
    } as QXDataParams,
    isQualified: JCJG === "1",
  };
};

const emit = createEmit(channel.kh_hmis_api_set);

const api_set = async (id: number) => {
  const record = await db.query.khBarcodeTable.findFirst({
    where: sql.eq(schema.khBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  const data = await recordToBody(record);
  await fetch_set(data.basicBody);

  if (!data.isQualified) {
    await saveQXData(data.qxBody);
  }

  const [result] = await db
    .update(schema.khBarcodeTable)
    .set({ isUploaded: true })
    .where(sql.eq(schema.khBarcodeTable.id, id))
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
  const delay = kh_hmis.get("autoUploadInterval") * 1000;
  timer = setTimeout(autoUploadHandler, delay);

  const barcodes = await db.query.khBarcodeTable.findMany({
    where: sql.and(
      sql.eq(schema.khBarcodeTable.isUploaded, false),
      sql.between(
        schema.khBarcodeTable.date,
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
  if (kh_hmis.get("autoUpload")) {
    autoUploadHandler();
  }

  kh_hmis.onDidChange("autoUpload", (value) => {
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
    channel.kh_hmis_sqlite_get,
    (_, params: PRELOAD.KhBarcodeGetParams) => sqlite_get(params),
  );

  ipcHandle(channel.kh_hmis_sqlite_delete, (_, id: number) =>
    sqlite_delete(id),
  );

  ipcHandle(channel.kh_hmis_api_get, (_, barcode: string) => api_get(barcode));
  ipcHandle(channel.kh_hmis_api_set, (_, id: number) => api_set(id));

  ipcHandle(
    channel.kh_hmis_setting,
    (_, data?: PRELOAD.KhHmisSettingParams) => {
      if (data) {
        kh_hmis.set(data);
      }
      return kh_hmis.store;
    },
  );
};

export const init = () => {
  initIpc();
  initAutoUpload();
};
