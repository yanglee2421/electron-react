// 成都北 华兴致远

import dayjs from "dayjs";
import { net } from "electron";
import * as sql from "drizzle-orm";
import * as schema from "#main/schema";
import { getIP, createEmit } from "#main/lib";
import { withLog, ipcHandle, log } from "#main/lib/ipc";
import type { SQLiteGetParams, HxzyGetResponse } from "#main/lib/ipc";
import type { AppContext } from "#main/index";
import type {
  DetectionData,
  MDBDB,
  Verify,
  VerifyData,
} from "#main/modules/mdb";

type PostRequestItem = {
  EQ_IP: string; // 设备IP
  EQ_BH: string; // 设备编号
  GD: string; // 股道号
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

const sqlite_get = async (params: SQLiteGetParams, appContext: AppContext) => {
  const { sqliteDB: db } = appContext;
  const [{ count }] = await db
    .select({ count: sql.count() })
    .from(schema.hxzyBarcodeTable)
    .where(
      sql.between(
        schema.hxzyBarcodeTable.date,
        new Date(params.startDate),
        new Date(params.endDate),
      ),
    )
    .limit(1);
  const rows = await db.query.hxzyBarcodeTable.findMany({
    where: sql.between(
      schema.hxzyBarcodeTable.date,
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
  appContext: AppContext,
): Promise<schema.HxzyBarcode> => {
  const { sqliteDB: db } = appContext;
  const [result] = await db
    .delete(schema.hxzyBarcodeTable)
    .where(sql.eq(schema.hxzyBarcodeTable.id, id))
    .returning();
  return result;
};

const fetch_get = async (barcode: string, appContext: AppContext) => {
  const { hxzy_hmis } = appContext;
  const host = hxzy_hmis.get("host");
  const url = new URL(
    `http://${host}/lzjx/dx/csbts/device_api/csbts/api/getDate`,
  );
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", barcode);
  log(`请求数据:${url.href}`);
  const res = await net.fetch(url.href, { method: "GET" });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data: HxzyGetResponse = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);

  return data;
};

const fetch_set = async (
  request: PostRequestItem[],
  appContext: AppContext,
) => {
  const { hxzy_hmis } = appContext;
  const host = hxzy_hmis.get("host");
  const url = new URL(
    `http://${host}/lzjx/dx/csbts/device_api/csbts/api/saveData`,
  );
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
const api_get = async (
  barcode: string,
  appContext: AppContext,
): Promise<HxzyGetResponse> => {
  const { sqliteDB: db } = appContext;
  const data = await fetch_get(barcode, appContext);

  await db.insert(schema.hxzyBarcodeTable).values({
    barCode: barcode,
    zh: data.data[0].ZH,
    date: new Date(),
    isUploaded: false,
  });

  return data;
};

const recordToBody = async (
  record: schema.HxzyBarcode,
  appContext: AppContext,
): Promise<PostRequestItem> => {
  const { mdbDB: mdb, hxzy_hmis } = appContext;
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

  const corporation = await mdb.getCorporation();
  const EQ_IP = corporation.DeviceNO || "";
  const EQ_BH = getIP();
  const GD = hxzy_hmis.get("gd");
  const startDate = dayjs(record.date).toISOString();
  const endDate = dayjs(record.date).endOf("day").toISOString();

  const detection = await mdb.getDetectionByZH({
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
      detectionDatas = await mdb.getDetectionDatasByOPID(detection.szIDs);
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
    EQ_IP,
    EQ_BH,
    GD,
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

const emit = createEmit("api_set");
const api_set = async (id: number, appContext: AppContext) => {
  const { sqliteDB: db } = appContext;

  const record = await db.query.hxzyBarcodeTable.findFirst({
    where: sql.eq(schema.hxzyBarcodeTable.id, id),
  });

  if (!record) {
    throw new Error(`记录#${id}不存在`);
  }

  if (!record.zh) {
    throw new Error(`记录#${id}轴号不存在`);
  }

  const postParams = await recordToBody(record, appContext);

  await fetch_set([postParams], appContext);
  const [result] = await db
    .update(schema.hxzyBarcodeTable)
    .set({ isUploaded: true })
    .where(sql.eq(schema.hxzyBarcodeTable.id, id))
    .returning();

  emit();

  return result;
};

const idToUploadVerifiesData = async (id: string, mdb: MDBDB) => {
  const {
    rows: [verifies],
  } = await mdb.getDataFromRootDB<Verify>({
    tableName: "verifies",
    filters: [
      {
        type: "equal",
        field: "szIDs",
        value: id,
      },
    ],
  });

  if (!verifies) {
    throw new Error(`未找到ID[${id}]的verifies记录`);
  }

  const verifiesData = await mdb.getDataFromRootDB<VerifyData>({
    tableName: "verifies_data",
    filters: [
      {
        type: "equal",
        field: "opid",
        value: verifies.szIDs || "",
      },
    ],
  });

  return {
    verifies,
    verifiesData: verifiesData.rows,
  };
};

const doTask = withLog((id: number, appContext: AppContext) => {
  return api_set(id, appContext);
});
let timer: NodeJS.Timeout | null = null;

const autoUploadHandler = async (appContext: AppContext) => {
  const { sqliteDB: db, hxzy_hmis } = appContext;
  const delay = hxzy_hmis.get("autoUploadInterval") * 1000;
  timer = setTimeout(() => autoUploadHandler(appContext), delay);

  const barcodes = await db.query.hxzyBarcodeTable.findMany({
    where: sql.and(
      sql.eq(schema.hxzyBarcodeTable.isUploaded, false),
      sql.between(
        schema.hxzyBarcodeTable.date,
        dayjs().startOf("day").toDate(),
        dayjs().endOf("day").toDate(),
      ),
    ),
  });

  for (const barcode of barcodes) {
    await doTask(barcode.id, appContext).catch(Boolean);
  }
};

const initAutoUpload = (appContext: AppContext) => {
  const { hxzy_hmis } = appContext;

  if (hxzy_hmis.get("autoUpload")) {
    autoUploadHandler(appContext);
  }

  hxzy_hmis.onDidChange("autoUpload", (value) => {
    if (value) {
      autoUploadHandler(appContext);
      return;
    }

    if (!timer) return;
    clearTimeout(timer);
  });
};

export const bindIPCHandlers = (appContext: AppContext) => {
  const { hxzy_hmis, mdbDB } = appContext;

  ipcHandle("HMIS/hxzy_hmis_sqlite_delete", (_, id) => {
    return sqlite_delete(id, appContext);
  });
  ipcHandle("HMIS/hxzy_hmis_api_get", (_, barcode) => {
    return api_get(barcode, appContext);
  });
  ipcHandle("HMIS/hxzy_hmis_api_set", (_, id) => {
    return api_set(id, appContext);
  });
  ipcHandle("HMIS/hxzy_hmis_api_verifies", (_, id) => {
    return idToUploadVerifiesData(id, mdbDB);
  });

  ipcHandle("HMIS/hxzy_hmis_sqlite_get", (_, params) => {
    return sqlite_get(params, appContext);
  });

  ipcHandle("HMIS/hxzy_hmis_setting", async (_, data) => {
    if (data) {
      hxzy_hmis.set(data);
    }
    return hxzy_hmis.store;
  });

  initAutoUpload(appContext);
};
