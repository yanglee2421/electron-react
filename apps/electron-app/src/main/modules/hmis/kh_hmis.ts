// 康华 安康

import dayjs from "dayjs";
import { net } from "electron";
import * as sql from "drizzle-orm";
import * as schema from "#main/schema";
import { createEmit } from "#main/lib";
import { log, withLog, ipcHandle } from "#main/lib/ipc";
import type { AppContext } from "#main/index";
import type { KHGetResponse, SQLiteGetParams } from "#main/lib/ipc";

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

const sqlite_get = async (appContext: AppContext, params: SQLiteGetParams) => {
  const { sqliteDB: db } = appContext;

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

const sqlite_delete = async (appContext: AppContext, id: number) => {
  const { sqliteDB: db } = appContext;

  const [result] = await db
    .delete(schema.khBarcodeTable)
    .where(sql.eq(schema.khBarcodeTable.id, id))
    .returning();
  return result;
};

const fetch_get = async (appContext: AppContext, barCode: string) => {
  const { kh_hmis } = appContext;
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
  const data: KHGetResponse = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (data.code !== 200) {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};

const fetch_set = async (appContext: AppContext, params: PostRequestItem) => {
  const { kh_hmis } = appContext;
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

const saveQXData = async (appContext: AppContext, params: QXDataParams) => {
  const { kh_hmis } = appContext;
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
const api_get = async (
  appContext: AppContext,
  barCode: string,
): Promise<KHGetResponse> => {
  const { sqliteDB: db } = appContext;
  const data = await fetch_get(appContext, barCode);

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

const recordToBody = async (
  appContext: AppContext,
  record: schema.KhBarcode,
) => {
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

  const { kh_hmis, mdbDB } = appContext;

  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();
  const corporation = await mdbDB.getCorporation();

  const detection = await mdbDB.getDetectionByZH({
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

const emit = createEmit("api_set");

const api_set = async (appContext: AppContext, id: number) => {
  const { sqliteDB: db } = appContext;
  const record = await db.query.khBarcodeTable.findFirst({
    where: sql.eq(schema.khBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  const data = await recordToBody(appContext, record);
  await fetch_set(appContext, data.basicBody);

  if (!data.isQualified) {
    await saveQXData(appContext, data.qxBody);
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
let timer: number | null = null;

const autoUploadHandler = async (appContext: AppContext) => {
  const { kh_hmis, sqliteDB: db } = appContext;
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
    await doTask(appContext, barcode.id).catch(Boolean);
  }
};

const initAutoUpload = (appContext: AppContext) => {
  const { kh_hmis } = appContext;

  if (kh_hmis.get("autoUpload")) {
    autoUploadHandler(appContext);
  }

  kh_hmis.onDidChange("autoUpload", (value) => {
    if (value) {
      autoUploadHandler(appContext);
      return;
    }

    if (!timer) return;
    clearTimeout(timer);
  });
};

export const bindIpcHandlers = (appContext: AppContext) => {
  ipcHandle("HMIS/kh_hmis_sqlite_get", (_, params) =>
    sqlite_get(appContext, params),
  );
  ipcHandle("HMIS/kh_hmis_sqlite_delete", (_, id) =>
    sqlite_delete(appContext, id),
  );
  ipcHandle("HMIS/kh_hmis_api_get", (_, barcode) =>
    api_get(appContext, barcode),
  );
  ipcHandle("HMIS/kh_hmis_api_set", (_, id) => api_set(appContext, id));
  ipcHandle("HMIS/kh_hmis_setting", async (_, data) => {
    const { kh_hmis } = appContext;

    if (data) {
      kh_hmis.set(data);
    }

    return kh_hmis.store;
  });

  initAutoUpload(appContext);
};
