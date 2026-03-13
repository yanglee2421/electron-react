// 京天威 统型

import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import { createEmit, getIP } from "#main/lib";
import type {
  InsertRecordParams,
  IpcHandle,
  SQLiteGetParams,
} from "#main/lib/ipc";
import { log } from "#main/lib/ipc";
import type { Detection, DetectionData, MDBDB } from "#main/modules/mdb";
import {
  detectionDataToTPlace,
  tmnowToTSSJ,
} from "#shared/functions/flawDetection";
import { JTV_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import { jtv_hmis, type JTV_HMIS } from "#shared/instances/schema";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import pLimit from "p-limit";
import type { KV } from "../KV";
import { HMIS, type Net } from "./hmis";

interface ZH_Item {
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
}

interface ZH_Response {
  code: string;
  msg: string;
  data: ZH_Item[];
}

interface DH_Item {
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
}

interface DH_Response {
  code: string;
  msg: string;
  data: DH_Item[];
}

interface PostItem {
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
}

interface PostResponse {
  code: "200";
  msg: "数据上传成功";
}

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

const emit = createEmit("api_set");

export interface Ipc {
  "HMIS/jtv_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<typeof JTV.prototype.handleReadRecord>;
  };
  "HMIS/jtv_hmis_sqlite_delete": {
    args: [number];
    return: ReturnType<typeof JTV.prototype.handleDeleteRecord>;
  };
  "HMIS/jtv_hmis_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<typeof JTV.prototype.handleInsertRecord>;
  };
  "HMIS/jtv_hmis_api_get": {
    args: [string, boolean?];
    return: ReturnType<typeof JTV.prototype.handleFetch>;
  };
  "HMIS/jtv_hmis_api_set": {
    args: [number];
    return: ReturnType<typeof JTV.prototype.handleUpload>;
  };
}

export class JTV extends HMIS<JTV_HMIS> {
  private db: SQLiteDBType;
  private mdb: MDBDB;
  private net: Net;

  constructor(db: SQLiteDBType, kv: KV, mdb: MDBDB, net: Net) {
    super(jtv_hmis.parse, JTV_HMIS_STORAGE_KEY, kv);

    this.db = db;
    this.mdb = mdb;
    this.net = net;
  }

  async hydrate() {
    await super.hydrate();

    this.autoUploadLoop();
  }

  async autoUploadLoop() {
    if (!this.getStore().autoUpload) {
      return;
    }

    const limit = pLimit(1);

    try {
      const barcodes = await this.db
        .select()
        .from(schema.jtvBarcodeTable)
        .where(
          sql.and(
            sql.eq(schema.jtvBarcodeTable.isUploaded, false),
            sql.between(
              schema.jtvBarcodeTable.date,
              dayjs().startOf("day").toDate(),
              dayjs().endOf("day").toDate(),
            ),
          ),
        );

      await Promise.allSettled(
        barcodes.map((barcode) => limit(() => this.handleUpload(barcode.id))),
      );
    } finally {
      const store = this.getStore();
      const timeout = store.autoUploadInterval * 1000;

      setTimeout(this.autoUploadLoop.bind(this), timeout);
    }
  }

  makeDataRequestURL(dh: string) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const unitCode = store.unitCode;
    const url = new URL(`http://${host}/api/getData`);

    url.searchParams.set("param", [dh, unitCode].join(","));

    return url;
  }

  async fetchAxleInfoByZH(zh: string) {
    const url = this.makeDataRequestURL(zh);

    url.searchParams.set("type", "csbtszh");
    log(`请求轴号数据:${url.href}`);

    const res = await this.net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw new Error(`接口异常[${res.status}]:${res.statusText}`);
    }

    const data: ZH_Response = await res.json();
    log(`返回轴号数据:${JSON.stringify(data)}`);

    if (data.code !== "200") {
      throw new Error(data.msg);
    }

    return data;
  }

  async fetchAxleInfoByDH(dh: string) {
    const url = this.makeDataRequestURL(dh);

    url.searchParams.set("type", "csbts");
    log(`请求单号数据:${url.href}`);

    const res = await this.net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw new Error(`接口异常[${res.status}]:${res.statusText}`);
    }

    const data: DH_Response = await res.json();
    log(`返回单号数据:${JSON.stringify(data)}`);

    if (data.code !== "200") {
      throw new Error(data.msg);
    }

    return data;
  }

  async sendPostRequest(request: PostItem[]) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/saveData`);
    const body = JSON.stringify(request);

    url.searchParams.set("type", "csbts");
    log(`请求数据:${url.href},${body}`);

    const res = await this.net.fetch(url.href, {
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
  }

  makePostItem(
    eq_ip: string,
    eq_bh: string,
    record: schema.JTVBarcode,
    detection: Detection,
    detectionData?: DetectionData,
  ) {
    const store = this.getStore();
    const user = detection.szUsername || "";
    const signature_prefix = store.signature_prefix;
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
  }

  async recordToBody(record: schema.JTVBarcode) {
    const id = record.id;

    if (!record.zh) {
      throw new Error(`记录#${id}轴号不存在`);
    }

    if (!record.barCode) {
      throw new Error(`记录#${id}条形码不存在`);
    }

    const corporation = await this.mdb.getCorporation();
    const eq_bh = corporation.DeviceNO || "";
    const eq_ip = getIP();
    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();

    const detection = await this.mdb.getDetectionForJTV({
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
        detectionDatas = await this.mdb.getDetectionDatasByOPID(
          detection.szIDs,
        );
        break;
      default:
    }

    if (detectionDatas.length === 0) {
      return [this.makePostItem(eq_ip, eq_bh, record, detection)];
    }

    return detectionDatas.map((detectionData) => {
      return this.makePostItem(eq_ip, eq_bh, record, detection, detectionData);
    });
  }

  async handleFetch(dh: string, isZhMode?: boolean) {
    if (isZhMode) {
      const data = await this.fetchAxleInfoByZH(dh);
      const result = normalizeZHResponse(data);

      return result;
    } else {
      const data = await this.fetchAxleInfoByDH(dh);
      const result = normalizeDHResponse(data);

      return result;
    }
  }
  async handleUpload(id: number) {
    const [record] = await this.db
      .select()
      .from(schema.jtvBarcodeTable)
      .where(sql.eq(schema.jtvBarcodeTable.id, id));

    if (!record) {
      throw new Error(`记录#${id}不存在`);
    }

    const body = await this.recordToBody(record);
    await this.sendPostRequest(body);

    const result = await this.db
      .update(schema.jtvBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.jtvBarcodeTable.id, record.id))
      .returning();

    // 上传不一定是由界面操作触发的，所以在这里主动触发一次事件，通知界面更新
    emit();

    return result;
  }
  async handleReadRecord(params: SQLiteGetParams) {
    const [{ count }] = await this.db
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

    const rows = await this.db._query.jtvBarcodeTable.findMany({
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
  }
  handleDeleteRecord(id: number) {
    return this.db
      .delete(schema.jtvBarcodeTable)
      .where(sql.eq(schema.jtvBarcodeTable.id, id))
      .returning();
  }
  handleInsertRecord(data: InsertRecordParams) {
    return this.db
      .insert(schema.jtvBarcodeTable)
      .values({
        barCode: data.DH,
        zh: data.ZH,
        date: new Date(),
        isUploaded: false,
      })
      .returning();
  }
}

export const bindIpcHandlers = (hmis: JTV, ipcHandle: IpcHandle) => {
  ipcHandle("HMIS/jtv_hmis_sqlite_get", (_, params) => {
    return hmis.handleReadRecord(params);
  });
  ipcHandle("HMIS/jtv_hmis_sqlite_delete", (_, id) => {
    return hmis.handleDeleteRecord(id);
  });
  ipcHandle("HMIS/jtv_hmis_sqlite_insert", (_, data) => {
    return hmis.handleInsertRecord(data);
  });
  ipcHandle("HMIS/jtv_hmis_api_get", (_, dh, isZhMode) => {
    return hmis.handleFetch(dh, isZhMode);
  });
  ipcHandle("HMIS/jtv_hmis_api_set", (_, id) => {
    return hmis.handleUpload(id);
  });
};
// Tongxing

export type JTVNormalizeResponse = {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZDW: string;
  CZZZRQ: string;
  MCZZDW: string;
  MCZZRQ: string;
  SCZZDW: string;
  SCZZRQ: string;
};
