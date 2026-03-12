// 京天威 广州北

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
import { JTV_HMIS_GUANGZHOUBEI_STORAGE_KEY } from "#shared/instances/constants";
import {
  jtv_hmis_guangzhoubei,
  type JTV_HMIS_Guangzhoubei,
} from "#shared/instances/schema";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import pLimit from "p-limit";
import type { KV } from "../KV";
import { HMIS, type Net } from "./hmis";

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
  ZTX: boolean;
  YTX: boolean;

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
  ZTX: boolean;
  YTX: boolean;

  SRYY?: string | null;
  SRDW?: string | null;
};

type DH_Response = {
  code: string;
  msg: string;
  data: DH_Item[];
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
      ZTX: record.ZTX,
      YTX: record.YTX,
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
      ZTX: record.ZTX,
      YTX: record.YTX,
    };
  });
};

const emit = createEmit("api_set");

export interface Ipc {
  "HMIS/jtv_hmis_guangzhoubei_api_get": {
    args: [string, boolean?];
    return: ReturnType<typeof Guangzhoubei.prototype.handleFetch>;
  };
  "HMIS/jtv_hmis_guangzhoubei_api_set": {
    args: [number];
    return: ReturnType<typeof Guangzhoubei.prototype.handleUpload>;
  };
  "HMIS/jtv_hmis_guangzhoubei_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<typeof Guangzhoubei.prototype.handleReadRecord>;
  };
  "HMIS/jtv_hmis_guangzhoubei_sqlite_delete": {
    args: [number];
    return: ReturnType<typeof Guangzhoubei.prototype.handleDeleteRecord>;
  };
  "HMIS/jtv_hmis_guangzhoubei_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<typeof Guangzhoubei.prototype.handleInsertRecord>;
  };
}

export class Guangzhoubei extends HMIS<JTV_HMIS_Guangzhoubei> {
  private db: SQLiteDBType;
  private mdb: MDBDB;
  private net: Net;

  constructor(db: SQLiteDBType, kv: KV, mdb: MDBDB, net: Net) {
    super(jtv_hmis_guangzhoubei.parse, JTV_HMIS_GUANGZHOUBEI_STORAGE_KEY, kv);

    this.db = db;
    this.mdb = mdb;
    this.net = net;
  }

  async hydrate() {
    await super.hydrate();

    this.autoUploadLoop();
  }

  async autoUploadLoop() {
    if (!this.getStore().autoUpload) return;

    const limit = pLimit(1);

    try {
      const barcodes = await this.db
        .select()
        .from(schema.jtvGuangzhoubeiBarcodeTable)
        .where(
          sql.and(
            sql.eq(schema.jtvGuangzhoubeiBarcodeTable.isUploaded, false),
            sql.between(
              schema.jtvGuangzhoubeiBarcodeTable.date,
              dayjs().startOf("day").toDate(),
              dayjs().endOf("day").toDate(),
            ),
          ),
        );

      await Promise.allSettled(
        barcodes.map((dh) => limit(() => this.handleUpload(dh.id))),
      );
    } finally {
      const store = this.getStore();
      const delay = store.autoUploadInterval * 1000;

      setTimeout(this.autoUploadLoop.bind(this), delay);
    }
  }

  makeDataRequestURL(dh: string) {
    const store = this.getStore();
    const host = store.get_host;
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

  async sendDataToServer(request: PostItem[]) {
    const store = this.getStore();
    const host = store.post_host;
    const url = new URL(`http://${host}/pmss/example.do`);
    const body = JSON.stringify(request);

    url.searchParams.set("method", "saveData");
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

    const data: boolean = await res.json();
    log(`返回数据:${JSON.stringify(data)}`);

    return data;
  }

  makePostItem(
    eq_ip: string,
    eq_bh: string,
    record: schema.JTVGuangzhoubeiBarcode,
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

  async makeRequestBody(record: schema.JTVGuangzhoubeiBarcode) {
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
      .from(schema.jtvGuangzhoubeiBarcodeTable)
      .where(sql.eq(schema.jtvGuangzhoubeiBarcodeTable.id, id))
      .limit(1);

    if (!record) {
      throw new Error(`记录#${id}不存在`);
    }

    const body = await this.makeRequestBody(record);
    await this.sendDataToServer(body);

    const result = await this.db
      .update(schema.jtvGuangzhoubeiBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.jtvGuangzhoubeiBarcodeTable.id, record.id))
      .returning();

    emit();

    return result;
  }
  async handleReadRecord(params: SQLiteGetParams) {
    const [{ count }] = await this.db
      .select({ count: sql.count() })
      .from(schema.jtvGuangzhoubeiBarcodeTable)
      .where(
        sql.between(
          schema.jtvGuangzhoubeiBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .limit(1);

    const rows = await this.db
      .select()
      .from(schema.jtvGuangzhoubeiBarcodeTable)
      .where(
        sql.between(
          schema.jtvGuangzhoubeiBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .offset(params.pageIndex * params.pageSize)
      .limit(params.pageSize)
      .orderBy(sql.desc(schema.jtvGuangzhoubeiBarcodeTable.date));

    return { rows, count };
  }
  handleDeleteRecord(id: number) {
    return this.db
      .delete(schema.jtvGuangzhoubeiBarcodeTable)
      .where(sql.eq(schema.jtvGuangzhoubeiBarcodeTable.id, id))
      .returning();
  }
  handleInsertRecord(params: InsertRecordParams) {
    return this.db
      .insert(schema.jtvGuangzhoubeiBarcodeTable)
      .values({
        barCode: params.DH,
        zh: params.ZH,
        date: new Date(),
        isUploaded: false,
        CZZZDW: params.CZZZDW,
        CZZZRQ: params.CZZZRQ,
      })
      .returning();
  }
}

export const bindIpcHandlers = (hmis: Guangzhoubei, ipcHandle: IpcHandle) => {
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_sqlite_get", (_, params) => {
    return hmis.handleReadRecord(params);
  });
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_sqlite_delete", (_, id) => {
    return hmis.handleDeleteRecord(id);
  });
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_sqlite_insert", (_, data) => {
    return hmis.handleInsertRecord(data);
  });
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_api_get", (_, barcode, isZhMode) => {
    return hmis.handleFetch(barcode, isZhMode);
  });
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_api_set", (_, id) => {
    return hmis.handleUpload(id);
  });
}; // Guangzhoubei

export type NormalizeResponse = {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZDW: string;
  CZZZRQ: string;
  MCZZDW: string;
  MCZZRQ: string;
  SCZZDW: string;
  SCZZRQ: string;
  ZTX: boolean;
  YTX: boolean;
};
