// 京天威 徐州北

import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import { createEmit } from "#main/lib";
import type { IpcHandle, SQLiteGetParams } from "#main/lib/ipc";
import { log } from "#main/lib/ipc";
import type { MDBDB } from "#main/modules/mdb";
import {
  calculateDirection,
  calculatePlace,
} from "#shared/functions/flawDetection";
import { JTV_HMIS_XUZHOUBEI_STORAGE_KEY } from "#shared/instances/constants";
import {
  jtv_hmis_xuzhoubei,
  type JTV_HMIS_XUZHOUBEI,
} from "#shared/instances/schema";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import pLimit from "p-limit";
import type { KV } from "../KV";
import { HMIS, type Net } from "./hmis";

export type XZBGetResponse = [
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

const formatDate = (date: string | null) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

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

const emit = createEmit("api_set");

export interface InsertRecordParams {
  barCode: string;
  zh: string;
  PJ_ZZRQ: string;
  PJ_ZZDW: string;
  PJ_SCZZRQ: string;
  PJ_SCZZDW: string;
  PJ_MCZZRQ: string;
  PJ_MCZZDW: string;
}

export interface Ipc {
  "HMIS/jtv_hmis_xuzhoubei_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<typeof Xuzhoubei.prototype.handleReadRecord>;
  };
  "HMIS/jtv_hmis_xuzhoubei_sqlite_delete": {
    args: [number];
    return: ReturnType<typeof Xuzhoubei.prototype.handleDeleteRecord>;
  };
  "HMIS/jtv_hmis_xuzhoubei_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<typeof Xuzhoubei.prototype.handleInsertRecord>;
  };
  "HMIS/jtv_hmis_xuzhoubei_api_get": {
    args: [string];
    return: ReturnType<typeof Xuzhoubei.prototype.handleFetch>;
  };
  "HMIS/jtv_hmis_xuzhoubei_api_set": {
    args: [number];
    return: ReturnType<typeof Xuzhoubei.prototype.handleUpload>;
  };
}

export class Xuzhoubei extends HMIS<JTV_HMIS_XUZHOUBEI> {
  private db: SQLiteDBType;
  private mdb: MDBDB;
  private net: Net;

  constructor(db: SQLiteDBType, kv: KV, mdb: MDBDB, net: Net) {
    super(jtv_hmis_xuzhoubei.parse, JTV_HMIS_XUZHOUBEI_STORAGE_KEY, kv);

    this.db = db;
    this.mdb = mdb;
    this.net = net;
  }

  async hydrate() {
    await super.hydrate();

    this.autoUploadLoop();
  }

  async autoUploadLoop() {
    if (!this.getStore().autoInput) {
      return;
    }

    const limit = pLimit(1);

    try {
      const barcodes = await this.db
        .select()
        .from(schema.jtvXuzhoubeiBarcodeTable)
        .where(
          sql.and(
            sql.eq(schema.jtvXuzhoubeiBarcodeTable.isUploaded, false),
            sql.between(
              schema.jtvXuzhoubeiBarcodeTable.date,
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
      const delay = store.autoUploadInterval * 1000;

      setTimeout(this.autoUploadLoop.bind(this), delay);
    }
  }

  async recordToBody(record: schema.JtvXuzhoubeiBarcode) {
    if (!record.zh) {
      throw new Error(`记录轴号不存在`);
    }

    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();
    const corporation = await this.mdb.getCorporation();
    const detection = await this.mdb.getDetectionByZH({
      zh: record.zh,
      startDate,
      endDate,
    });

    const store = this.getStore();
    const SB_SN = corporation.DeviceNO || "";
    const usernameInDB = detection.szUsername || "";
    const user = [store.username_prefix, usernameInDB].join("");

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
      const detectionDatas = await this.mdb.getDetectionDatasByOPID(
        detection.szIDs,
      );

      if (detectionDatas.length === 0) {
        body.LW_TFLAW_PLACE = "车轴";
      } else {
        body.LW_TFLAW_PLACE = detectionDatas
          .reduce<string[]>((result, detectionData) => {
            const direction = calculateDirection(detectionData.nBoard);
            const place = calculatePlace(detectionData.nChannel);
            result.push(`${place}${direction}`);
            return result;
          }, [])
          .join(",");
      }

      body.LW_TVIEW = "疑似裂纹";
      body.LW_TFLAW_TYPE = "横裂纹";
    }

    return body;
  }

  async sendDataToServer(request: PostRequestItem) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
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

    if (!data) {
      throw `接口异常${data}`;
    }

    return data;
  }

  async handleFetch(dh: string) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/pmss/vjkxx.do`);

    url.searchParams.set("method", "getData");
    url.searchParams.set("type", "csbts");
    url.searchParams.set("param", dh);
    log(`请求数据:${url.href}`);

    const res = await this.net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: XZBGetResponse = await res.json();
    log(`返回数据:${JSON.stringify(data)}`);

    return data;
  }
  async handleUpload(id: number) {
    const [record] = await this.db
      .select()
      .from(schema.jtvXuzhoubeiBarcodeTable)
      .where(sql.eq(schema.jtvXuzhoubeiBarcodeTable.id, id));

    if (!record) {
      throw new Error(`记录#${id}不存在`);
    }

    if (!record.zh) {
      throw new Error(`记录#${id}轴号不存在`);
    }

    const body = await this.recordToBody(record);
    await this.sendDataToServer(body);

    const result = await this.db
      .update(schema.jtvXuzhoubeiBarcodeTable)
      .set({
        isUploaded: true,
      })
      .where(sql.eq(schema.jtvXuzhoubeiBarcodeTable.id, id))
      .returning();

    emit();

    return result;
  }
  async handleReadRecord(params: SQLiteGetParams) {
    const [{ count }] = await this.db
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

    const rows = await this.db
      .select()
      .from(schema.jtvXuzhoubeiBarcodeTable)
      .where(
        sql.between(
          schema.jtvXuzhoubeiBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .offset(params.pageIndex * params.pageSize)
      .limit(params.pageSize);

    return { rows, count };
  }
  handleDeleteRecord(id: number) {
    return this.db
      .delete(schema.jtvXuzhoubeiBarcodeTable)
      .where(sql.eq(schema.jtvXuzhoubeiBarcodeTable.id, id))
      .returning();
  }
  handleInsertRecord(params: InsertRecordParams) {
    return this.db
      .insert(schema.jtvXuzhoubeiBarcodeTable)
      .values({
        barCode: params.barCode,
        zh: params.zh,
        date: new Date(),
        isUploaded: false,
        PJ_ZZRQ: params.PJ_ZZRQ,
        PJ_ZZDW: params.PJ_ZZDW,
        PJ_SCZZRQ: params.PJ_SCZZRQ,
        PJ_SCZZDW: params.PJ_SCZZDW,
        PJ_MCZZRQ: params.PJ_MCZZRQ,
        PJ_MCZZDW: params.PJ_MCZZDW,
      })
      .returning();
  }
}

export const bindIpcHandlers = (hmis: Xuzhoubei, ipcHandle: IpcHandle) => {
  ipcHandle("HMIS/jtv_hmis_xuzhoubei_sqlite_get", (_, params) =>
    hmis.handleReadRecord(params),
  );
  ipcHandle("HMIS/jtv_hmis_xuzhoubei_sqlite_delete", (_, id) =>
    hmis.handleDeleteRecord(id),
  );
  ipcHandle("HMIS/jtv_hmis_xuzhoubei_sqlite_insert", (_, params) =>
    hmis.handleInsertRecord(params),
  );

  ipcHandle("HMIS/jtv_hmis_xuzhoubei_api_get", (_, barcode) =>
    hmis.handleFetch(barcode),
  );
  ipcHandle("HMIS/jtv_hmis_xuzhoubei_api_set", (_, id) =>
    hmis.handleUpload(id),
  );
};
