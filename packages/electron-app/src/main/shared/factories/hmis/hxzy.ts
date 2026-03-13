// 成都北 华兴致远

import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import { createEmit, getIP } from "#main/lib";
import {
  log,
  type InsertRecordParams,
  type IpcHandle,
  type SQLiteGetParams,
} from "#main/lib/ipc";
import type { DetectionData, MDBDB } from "#main/modules/mdb";
import { HXZY_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import { hxzy_hmis, type HXZY_HMIS } from "#shared/instances/schema";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import pLimit from "p-limit";
import type { KV } from "../KV";
import { HMIS, type Net } from "./hmis";

export interface HxzyGetResponse {
  code: "200";
  msg: "数据读取成功";
  data: [
    {
      CZZZDW: "048";
      CZZZRQ: "2009-10";
      MCZZDW: "131";
      MCZZRQ: "2018-07-09 00:00:00";
      SCZZDW: "131";
      SCZZRQ: "2018-07-09 00:00:00";
      DH: "91022070168";
      ZH: "67444";
      ZX: "RE2B";
      SRYY: "厂修";
      SRDW: "588";
    },
  ];
}

interface PostRequestItem {
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
}

interface PostResponse {
  code: "200";
  msg: "数据上传成功";
}

const emit = createEmit("api_set");

export class Hxzy extends HMIS<HXZY_HMIS> {
  private db: SQLiteDBType;
  private mdb: MDBDB;
  private net: Net;

  constructor(db: SQLiteDBType, kv: KV, mdb: MDBDB, net: Net) {
    super(hxzy_hmis.parse, HXZY_HMIS_STORAGE_KEY, kv);

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
        .from(schema.hxzyBarcodeTable)
        .where(
          sql.and(
            sql.eq(schema.hxzyBarcodeTable.isUploaded, false),
            sql.between(
              schema.hxzyBarcodeTable.date,
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

  async sendPostRequest(request: PostRequestItem[]) {
    const state = this.getStore();
    const host = state.ip + ":" + state.port;
    const body = JSON.stringify(request);

    const url = new URL(
      `http://${host}/lzjx/dx/csbts/device_api/csbts/api/saveData`,
    );

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
  async recordToPostBody(record: schema.HxzyBarcode) {
    const id = record.id;

    if (!record.zh) {
      throw new Error(`记录#${id}轴号不存在`);
    }

    if (!record.barCode) {
      throw new Error(`记录#${id}条形码不存在`);
    }

    const store = this.getStore();
    const corporation = await this.mdb.getCorporation();
    const EQ_IP = corporation.DeviceNO || "";
    const EQ_BH = getIP();
    const GD = store.gd;
    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();

    const detection = await this.mdb.getDetectionByZH({
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
        detectionDatas = await this.mdb.getDetectionDatasByOPID(
          detection.szIDs,
        );
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
  }

  async handleRecordRead(_: SQLiteGetParams) {
    const rows = await this.db
      .select()
      .from(schema.hxzyBarcodeTable)
      .offset(_.pageIndex * _.pageSize)
      .limit(_.pageSize);

    const [{ count }] = await this.db
      .select({ count: sql.count() })
      .from(schema.hxzyBarcodeTable)
      .where(
        sql.between(
          schema.hxzyBarcodeTable.date,
          new Date(_.startDate),
          new Date(_.endDate),
        ),
      )
      .limit(1);

    return { rows, count };
  }
  handleRecordDelete(id: number) {
    return this.db
      .delete(schema.hxzyBarcodeTable)
      .where(sql.eq(schema.hxzyBarcodeTable.id, id))
      .returning();
  }
  handleRecordInsert(_: InsertRecordParams) {
    return this.db
      .insert(schema.hxzyBarcodeTable)
      .values({
        barCode: _.DH,
        zh: _.ZH,
        date: new Date(),
        isUploaded: false,
      })
      .returning();
  }
  async handleFetch(dh: string) {
    const state = this.getStore();
    const host = state.ip + ":" + state.port;

    const url = new URL(
      `http://${host}/lzjx/dx/csbts/device_api/csbts/api/getDate`,
    );

    url.searchParams.set("type", "csbts");
    url.searchParams.set("param", dh);
    log(`请求数据:${url.href}`);

    const res = await this.net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: HxzyGetResponse = await res.json();
    log(`返回数据:${JSON.stringify(data)}`);

    return data;
  }
  async handleUpload(id: number) {
    const [record] = await this.db
      .select()
      .from(schema.hxzyBarcodeTable)
      .where(sql.eq(schema.hxzyBarcodeTable.id, id));

    if (!record) {
      throw new Error(`记录#${id}不存在`);
    }

    if (!record.zh) {
      throw new Error(`记录#${id}轴号不存在`);
    }

    const postParams = await this.recordToPostBody(record);

    await this.sendPostRequest([postParams]);
    const [result] = await this.db
      .update(schema.hxzyBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.hxzyBarcodeTable.id, id))
      .returning();

    emit();

    return result;
  }
}

export interface Ipc {
  "HMIS/hxzy_hmis_api_get": {
    args: [string];
    return: ReturnType<typeof Hxzy.prototype.handleFetch>;
  };
  "HMIS/hxzy_hmis_api_set": {
    args: [number];
    return: ReturnType<typeof Hxzy.prototype.handleUpload>;
  };
  "HMIS/hxzy_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<typeof Hxzy.prototype.handleRecordRead>;
  };
  "HMIS/hxzy_hmis_sqlite_delete": {
    args: [number];
    return: ReturnType<typeof Hxzy.prototype.handleRecordDelete>;
  };
  "HMIS/hxzy_hmis_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<typeof Hxzy.prototype.handleRecordInsert>;
  };
}

export const bindIPCHandlers = (hmis: Hxzy, ipcHandle: IpcHandle) => {
  ipcHandle("HMIS/hxzy_hmis_api_get", (_, barcode) => {
    return hmis.handleFetch(barcode);
  });
  ipcHandle("HMIS/hxzy_hmis_api_set", (_, id) => {
    return hmis.handleUpload(id);
  });
  ipcHandle("HMIS/hxzy_hmis_sqlite_get", (_, params) => {
    return hmis.handleRecordRead(params);
  });
  ipcHandle("HMIS/hxzy_hmis_sqlite_delete", (_, id) => {
    return hmis.handleRecordDelete(id);
  });
  ipcHandle("HMIS/hxzy_hmis_sqlite_insert", (_, params) => {
    return hmis.handleRecordInsert(params);
  });
};
