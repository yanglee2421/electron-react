// 康华 安康
import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import { createEmit } from "#main/lib";
import type {
  InsertRecordParams,
  IpcHandle,
  SQLiteGetParams,
} from "#main/lib/ipc";
import { log } from "#main/lib/ipc";
import type {
  Detecotor,
  MDBDB,
  Quartor,
  QuartorData,
  QuartorYearlyData,
  Verify,
  VerifyData,
} from "#main/modules/mdb";
import type { Net } from "#main/shared/factories/hmis/hmis";
import { HMIS } from "#main/shared/factories/hmis/hmis";
import type { KV } from "#main/shared/factories/KV";
import { DetectorMap } from "#shared/factories/DetectorMap";
import { FlawMatrix } from "#shared/factories/FlawMatrix";
import { calculateErrorMessage } from "#shared/functions/error";
import {
  calculateAttResult,
  calculateDecResult,
  calculateJY,
  calculateNAtten,
  calculateNAttenDiff,
  calculateQuartorResult,
  calculateTS,
  calculateXHCChNo,
  calculateZSJ,
  createFlawGroup,
  createNChannelGroup,
  verifyFlawGroup,
} from "#shared/functions/flawDetection";
import { KH_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import type { KH_HMIS } from "#shared/instances/schema";
import { kh_hmis } from "#shared/instances/schema";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import * as mathjs from "mathjs";
import os from "node:os";
import pLimit from "p-limit";
import type { CHR501InputParams } from "./kh501";
import type { CHR502InputParams } from "./kh502";
import type { CHR503InputParams } from "./kh503";

export interface KHGetResponse {
  data: {
    mesureId: string;
    zh: string;
    zx: string;
    clbjLeft: string;
    clbjRight: string;
    czzzrq: string;
    czzzdw: string;
    ldszrq: string;
    ldszdw: string;
    ldmzrq: string;
    ldmzdw: string;
  };
  code: number;
  msg: string;
}

interface QXDataParams {
  mesureid: string;
  zh: string;
  testdatetime: string;
  testtype: string;
  btcw: string;
  tsr: string;
  tsgz: string;
  tszjy: string;
  tsysy: string;
  gzmc: string;
  clff: string;
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
  bz: string;
}

interface PostRequestItem {
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
}

interface PostResponse {
  code: number;
  msg: string;
}

type VerifyWithData = Verify & {
  with: VerifyData[];
};

type QuartorWithData = Quartor & {
  with: QuartorData[];
};

const emit = createEmit("api_set");

export class KH extends HMIS<KH_HMIS> {
  private db: SQLiteDBType;
  private mdb: MDBDB;
  private net: Net;

  constructor(db: SQLiteDBType, kv: KV, mdb: MDBDB, net: Net) {
    super(kh_hmis.parse.bind(kh_hmis), KH_HMIS_STORAGE_KEY, kv);

    this.db = db;
    this.mdb = mdb;
    this.net = net;
  }

  async hydrate() {
    await super.hydrate();

    void this.autoUploadLoop();
  }

  async autoUploadLoop() {
    if (!this.getStore().autoUpload) {
      return;
    }

    const limit = pLimit(1);

    try {
      const barcodes = await this.db
        .select()
        .from(schema.khBarcodeTable)
        .where(
          sql.and(
            sql.eq(schema.khBarcodeTable.isUploaded, false),
            sql.between(
              schema.khBarcodeTable.date,
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

  async sendQxToServer(params: QXDataParams) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/lzdx_csbtsj_whzy_tsjgqx/save`);
    const body = JSON.stringify(params);

    log(`请求数据[${url.href}]:${body}`);

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

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }

  async recordToPostBody(record: schema.KhBarcode) {
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

    const store = this.getStore();
    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();
    const corporation = await this.mdb.getCorporation();
    const detection = await this.mdb.getDetectionByZH({
      zh: record.zh,
      startDate,
      endDate,
    });

    const JCJG = detection.szResult === "合格" ? "1" : "0";

    const basicBody: PostRequestItem = {
      mesureId: record.barCode,
      ZH: record.zh,
      // 1 探伤 0 不探伤
      ZCTJG: "1",
      YCTJG: "1",
      ZLZJG: "1",
      YLZJG: "1",
      ZZJJG: detection.bWheelLS ? "1" : "0",
      YZJJG: detection.bWheelRS ? "1" : "0",
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
        tsr: detection.szUsername,
        tsgz: store.tsgz,
        tszjy: store.tszjy,
        tsysy: store.tsysy,
        gzmc: "裂纹",
        clff: "人工复探",
        bz: "",
      } as QXDataParams,
      isQualified: JCJG === "1",
    };
  }
  async sendDataToServer(params: PostRequestItem) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/lzdx_csbtsj_tsjg/save`);
    const body = JSON.stringify(params);

    log(`请求数据[${url.href}]:${body}`);

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

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR501ToServer(params: CHR501InputParams) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/csbts_501/save`);
    const body = JSON.stringify(params);
    console.log("host", host);

    log(`请求数据[${url.href}]:${body}`);

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

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR502ToServer(params: CHR502InputParams) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/csbts_502/save`);
    const body = JSON.stringify(params);

    log(`请求数据[${url.href}]:${body}`);

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

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR503ToServer(params: CHR503InputParams) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/csbts_503/save`);
    const body = JSON.stringify(params);

    log(`请求数据[${url.href}]:${body}`);

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

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }

  async handleFetch(dh: string) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/lzdx_csbtsj_get/get`);
    const body = JSON.stringify({ mesureId: dh });

    log(`请求数据[${url.href}]:${body}`);

    const res = await this.net.fetch(url.href, {
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
  }
  async handleUpload(id: number) {
    const [record] = await this.db
      .select()
      .from(schema.khBarcodeTable)
      .where(sql.eq(schema.khBarcodeTable.id, id));

    if (!record) {
      throw new Error(`记录#${id}不存在`);
    }

    const data = await this.recordToPostBody(record);
    await this.sendDataToServer(data.basicBody);

    if (!data.isQualified) {
      await this.sendQxToServer(data.qxBody);
    }

    const result = await this.db
      .update(schema.khBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.khBarcodeTable.id, id))
      .returning();

    emit();

    return result;
  }
  async handleReadRecord(params: SQLiteGetParams) {
    const [{ count }] = await this.db
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

    const rows = await this.db
      .select()
      .from(schema.khBarcodeTable)
      .where(
        sql.between(
          schema.khBarcodeTable.date,
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
      .delete(schema.khBarcodeTable)
      .where(sql.eq(schema.khBarcodeTable.id, id))
      .returning();
  }
  handleInsertRecord(params: InsertRecordParams) {
    return this.db
      .insert(schema.khBarcodeTable)
      .values({
        barCode: params.DH,
        zh: params.ZH,
        date: new Date(),
        isUploaded: false,
      })
      .returning();
  }
  async handleUploadCHR501(id: string) {
    const records = await this.mdb.getDataFromRootDB<
      Verify & {
        with: VerifyData[];
      }
    >({
      tableName: "verifies",
      with: true,
      filters: [{ type: "equal", field: "szIDs", value: id }],
    });
    const [record] = records.rows;

    if (!record) {
      throw new Error(`未找到校验记录[${id}]`);
    }

    const chr501Params = await this.resolveCHR501InputParams(record);

    return this.sendCHR501ToServer(chr501Params);
  }
  async handleUploadCHR502(ids: string[]) {
    const records = await this.mdb.getDataForCHR502({ ids });

    if (records.rows.length < 5) {
      throw new Error(
        `CHR502接口至少需要5条记录，当前仅${records.rows.length}条`,
      );
    }

    const chr502Params = await this.resolveCHR502InputParams(
      records.rows,
      records.previous,
    );

    return this.sendCHR502ToServer(chr502Params);
  }
  async handleUploadCHR503(id: string) {
    const query = await this.mdb.getYearlyData(id);
    const chr503Params = await this.resolveCHR503InputParams(query.rows);

    return this.sendCHR503ToServer(chr503Params);
  }

  async resolveCHR501InputParams(
    record: VerifyWithData,
  ): Promise<CHR501InputParams> {
    const store = this.getStore();
    const corporation = await this.mdb.getCorporation();
    const flawMartix = new FlawMatrix(record.with);
    const detectors = await this.mdb.getDataFromAppDB<Detecotor>({
      tableName: "detectors",
      filters: [
        { type: "equal", field: "szwheel", value: record.szWHModel || "" },
      ],
    });
    const detectorMap = new DetectorMap(detectors.rows);

    return {
      xrsj: dayjs(record.tmNow).format("YYYY-MM-DD HH:mm:ss"),
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      ggxh: corporation.DeviceType || "",
      zzcj: "武铁紫云轨道装备有限公司",
      dwmc: corporation.Factory || "",
      jyrq: dayjs(record.tmNow).format("YYYY-MM-DD"),
      swmkxh: record.szWHModel || "",

      // 通道编号
      ztdbh1: "ch2",
      ztdbh2: "ch3",
      ztdbh3: "",
      ztdbh4: "",
      ztdbh5: "",
      ytdbh1: "ch8",
      ytdbh2: "ch9",
      ytdbh3: "",
      ytdbh4: "",
      ytdbh5: "",
      zzj_tdbh1: calculateXHCChNo(0, record.szWHModel || ""),
      zzj_tdbh2: "",
      zzj_tdbh3: "",
      yzj_tdbh1: calculateXHCChNo(1, record.szWHModel || ""),
      yzj_tdbh2: "",
      yzj_tdbh3: "",
      zct_tdbh1: "ch1",
      yct_tdbh1: "ch7",

      // 折射角、校验灵敏度、DB补偿、探伤灵敏度
      zzsj1: detectorMap.zsj(0, 3),
      zjy1: flawMartix.jy(0, 3),
      zbc1: detectorMap.bc(0, 3),
      zts1: detectorMap.ts(0, 3, flawMartix.getAtten(0, 3)),
      yzsj1: detectorMap.zsj(1, 3),
      yjy1: flawMartix.jy(1, 3),
      ybc1: detectorMap.bc(1, 3),
      yts1: detectorMap.ts(1, 3, flawMartix.getAtten(1, 3)),
      zzsj2: detectorMap.zsj(0, 4),
      zjy2: flawMartix.jy(0, 4),
      zbc2: detectorMap.bc(0, 4),
      zts2: detectorMap.ts(0, 4, flawMartix.getAtten(0, 4)),
      yzsj2: detectorMap.zsj(1, 4),
      yjy2: flawMartix.jy(1, 4),
      ybc2: detectorMap.bc(1, 4),
      yts2: detectorMap.ts(1, 4, flawMartix.getAtten(1, 4)),

      zzsj3: "",
      zjy3: "",
      zbc3: "",
      zts3: "",
      yzsj3: "",
      yjy3: "",
      ybc3: "",
      yts3: "",
      zzsj4: "",
      zjy4: "",
      zbc4: "",
      zts4: "",
      yzsj4: "",
      yjy4: "",
      ybc4: "",
      yts4: "",
      zzsj5: "",
      zjy5: "",
      zbc5: "",
      zts5: "",
      yzsj5: "",
      yjy5: "",
      ybc5: "",
      yts5: "",

      zzj_zsj1: detectorMap.zsj(0, 1),
      zzj_jy1: flawMartix.jy(0, 1),
      zzj_bc1: detectorMap.bc(0, 1),
      zzj_ts1: detectorMap.ts(0, 1, flawMartix.getAtten(0, 1)),
      yzj_zsj1: detectorMap.zsj(1, 1),
      yzj_jy1: flawMartix.jy(1, 1),
      yzj_bc1: detectorMap.bc(1, 1),
      yzj_ts1: detectorMap.ts(1, 1, flawMartix.getAtten(1, 1)),

      zzj_zsj2: "",
      zzj_jy2: "",
      zzj_bc2: "",
      zzj_ts2: "",
      yzj_zsj2: "",
      yzj_jy2: "",
      yzj_bc2: "",
      yzj_ts2: "",
      zzj_zsj3: "",
      zzj_jy3: "",
      zzj_bc3: "",
      zzj_ts3: "",
      yzj_zsj3: "",
      yzj_jy3: "",
      yzj_bc3: "",
      yzj_ts3: "",

      zct_zsj1: detectorMap.zsj(0, 0),
      zct_jy1: flawMartix.jy(0, 0),
      zct_bc1: detectorMap.bc(0, 0),
      zct_ts1: detectorMap.ts(0, 0, flawMartix.getAtten(0, 0)),
      yct_zsj1: detectorMap.zsj(1, 0),
      yct_jy1: flawMartix.jy(1, 0),
      yct_bc1: detectorMap.bc(1, 0),
      yct_ts1: detectorMap.ts(1, 0, flawMartix.getAtten(1, 0)),

      // 缺陷
      zqx1_1: flawMartix.getLZFlawX(1, 0, 3),
      zqx1_2: flawMartix.getLZFlawX(1, 0, 4),
      zqx1_3: "",
      zqx1_4: "",
      zqx1_5: "",
      yqx1_1: flawMartix.getLZFlawX(1, 1, 3),
      yqx1_2: flawMartix.getLZFlawX(1, 1, 4),
      yqx1_3: "",
      yqx1_4: "",
      yqx1_5: "",
      zqx2_1: flawMartix.getLZFlawX(2, 0, 3),
      zqx2_2: flawMartix.getLZFlawX(2, 0, 4),
      zqx2_3: "",
      zqx2_4: "",
      zqx2_5: "",
      yqx2_1: flawMartix.getLZFlawX(2, 1, 3),
      yqx2_2: flawMartix.getLZFlawX(2, 1, 4),
      yqx2_3: "",
      yqx2_4: "",
      yqx2_5: "",
      zqx3_1: flawMartix.getLZFlawX(3, 0, 3),
      zqx3_2: flawMartix.getLZFlawX(3, 0, 4),
      zqx3_3: "",
      zqx3_4: "",
      zqx3_5: "",
      yqx3_1: flawMartix.getLZFlawX(3, 1, 3),
      yqx3_2: flawMartix.getLZFlawX(3, 1, 4),
      yqx3_3: "",
      yqx3_4: "",
      yqx3_5: "",
      zqx4_1: flawMartix.getLZFlawX(4, 0, 3),
      zqx4_2: flawMartix.getLZFlawX(4, 0, 4),
      zqx4_3: "",
      zqx4_4: "",
      zqx4_5: "",
      yqx4_1: flawMartix.getLZFlawX(4, 1, 3),
      yqx4_2: flawMartix.getLZFlawX(4, 1, 4),
      yqx4_3: "",
      yqx4_4: "",
      yqx4_5: "",
      zqx5_1: flawMartix.getLZFlawX(5, 0, 3),
      zqx5_2: flawMartix.getLZFlawX(5, 0, 4),
      zqx5_3: "",
      zqx5_4: "",
      zqx5_5: "",
      yqx5_1: flawMartix.getLZFlawX(5, 1, 3),
      yqx5_2: flawMartix.getLZFlawX(5, 1, 4),
      yqx5_3: "",
      yqx5_4: "",
      yqx5_5: "",
      zqx6_1: flawMartix.getLZFlawX(6, 0, 3),
      zqx6_2: flawMartix.getLZFlawX(6, 0, 4),
      zqx6_3: "",
      zqx6_4: "",
      zqx6_5: "",
      yqx6_1: flawMartix.getLZFlawX(6, 1, 3),
      yqx6_2: flawMartix.getLZFlawX(6, 1, 4),
      yqx6_3: "",
      yqx6_4: "",
      yqx6_5: "",
      zqx7_1: flawMartix.getLZFlawX(7, 0, 3),
      zqx7_2: flawMartix.getLZFlawX(7, 0, 4),
      zqx7_3: "",
      zqx7_4: "",
      zqx7_5: "",
      yqx7_1: flawMartix.getLZFlawX(7, 1, 3),
      yqx7_2: flawMartix.getLZFlawX(7, 1, 4),
      yqx7_3: "",
      yqx7_4: "",
      yqx7_5: "",
      zqx8_1: flawMartix.getLZFlawX(8, 0, 3),
      zqx8_2: flawMartix.getLZFlawX(8, 0, 4),
      zqx8_3: "",
      zqx8_4: "",
      zqx8_5: "",
      yqx8_1: flawMartix.getLZFlawX(8, 1, 3),
      yqx8_2: flawMartix.getLZFlawX(8, 1, 4),
      yqx8_3: "",
      yqx8_4: "",
      yqx8_5: "",
      zqx9_1: flawMartix.getLZFlawX(9, 0, 3),
      zqx9_2: flawMartix.getLZFlawX(9, 0, 4),
      zqx9_3: "",
      zqx9_4: "",
      zqx9_5: "",
      yqx9_1: flawMartix.getLZFlawX(9, 1, 3),
      yqx9_2: flawMartix.getLZFlawX(9, 1, 4),
      yqx9_3: "",
      yqx9_4: "",
      yqx9_5: "",
      zqx10_1: flawMartix.getLZFlawX(10, 0, 3),
      zqx10_2: flawMartix.getLZFlawX(10, 0, 4),
      zqx10_3: "",
      zqx10_4: "",
      zqx10_5: "",
      yqx10_1: flawMartix.getLZFlawX(10, 1, 3),
      yqx10_2: flawMartix.getLZFlawX(10, 1, 4),
      yqx10_3: "",
      yqx10_4: "",
      yqx10_5: "",
      zqx11_1: flawMartix.getLZFlawX(11, 0, 3),
      zqx11_2: flawMartix.getLZFlawX(11, 0, 4),
      zqx11_3: "",
      zqx11_4: "",
      zqx11_5: "",
      yqx11_1: flawMartix.getLZFlawX(11, 1, 3),
      yqx11_2: flawMartix.getLZFlawX(11, 1, 4),
      yqx11_3: "",
      yqx11_4: "",
      yqx11_5: "",

      zzj_qx1_1: flawMartix.getXHCFlawX(1, 0),
      zzj_qx1_2: "",
      zzj_qx1_3: "",
      yzj_qx1_1: flawMartix.getXHCFlawX(1, 1),
      yzj_qx1_2: "",
      yzj_qx1_3: "",
      zzj_qx2_1: flawMartix.getXHCFlawX(2, 0),
      zzj_qx2_2: "",
      zzj_qx2_3: "",
      yzj_qx2_1: flawMartix.getXHCFlawX(2, 1),
      yzj_qx2_2: "",
      yzj_qx2_3: "",
      zzj_qx3_1: flawMartix.getXHCFlawX(3, 0),
      zzj_qx3_2: "",
      zzj_qx3_3: "",
      yzj_qx3_1: flawMartix.getXHCFlawX(3, 1),
      yzj_qx3_2: "",
      yzj_qx3_3: "",
      zct_qx1_1: flawMartix.getFlawX(0, 0, 0),
      zct_qx1_2: "",
      zct_qx1_3: "",
      yct_qx1_1: flawMartix.getFlawX(1, 0, 0),
      yct_qx1_2: "",
      yct_qx1_3: "",

      // 人员相关
      czz: record.szUsername || "",
      gz: store.tsgz,
      wxg: store.tswxg,
      zjy: store.tszjy,
      ysy: store.tsysy,
      bz: "",
    };
  }
  async resolveCHR502InputParams(
    records: QuartorWithData[],
    previous: Quartor | null,
  ): Promise<CHR502InputParams> {
    if (records.length !== 5) {
      throw new Error(`CHR502接口需要5条记录，当前${records.length}条`);
    }

    const store = this.getStore();
    const corporation = await this.mdb.getCorporation();
    const tsg = records[0].szUsername || "";

    const firstData = createFlawGroup(records[0].with);
    try {
      verifyFlawGroup(firstData);
    } catch (error) {
      const message = calculateErrorMessage(error);
      throw new Error(`记录#${records[0].szIDs}数据异常:${message}`);
    }
    const secondData = createFlawGroup(records[1].with);
    try {
      verifyFlawGroup(secondData);
    } catch (error) {
      const message = calculateErrorMessage(error);
      throw new Error(`记录#${records[1].szIDs}数据异常:${message}`);
    }
    const thirdData = createFlawGroup(records[2].with);
    try {
      verifyFlawGroup(thirdData);
    } catch (error) {
      const message = calculateErrorMessage(error);
      throw new Error(`记录#${records[2].szIDs}数据异常:${message}`);
    }
    const fourthData = createFlawGroup(records[3].with);
    try {
      verifyFlawGroup(fourthData);
    } catch (error) {
      const message = calculateErrorMessage(error);
      throw new Error(`记录#${records[3].szIDs}数据异常:${message}`);
    }
    const fifthData = createFlawGroup(records[4].with);
    try {
      verifyFlawGroup(fifthData);
    } catch (error) {
      const message = calculateErrorMessage(error);
      throw new Error(`记录#${records[4].szIDs}数据异常:${message}`);
    }

    return {
      xrsj: dayjs(records[0].tmnow).format("YYYY-MM-DD HH:mm:ss"),
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      dwmc: corporation.Factory || "",
      zzsj: corporation.prodate || "",
      zzdw: "武汉武铁紫云轨道装备有限公司",
      scjxsj: previous ? dayjs(previous.tmnow).format("YYYY-MM-DD") : "",
      jyrq: dayjs(records[0].tmnow).format("YYYY-MM-DD"),
      zjgb_11_z: calculateNAtten(firstData.leftXHC[0]),
      zjgb_11_y: calculateNAtten(firstData.rightXHC[0]),
      zjgb_12_z: calculateNAtten(secondData.leftXHC[0]),
      zjgb_12_y: calculateNAtten(secondData.rightXHC[0]),
      zjgb_13_z: calculateNAtten(thirdData.leftXHC[0]),
      zjgb_13_y: calculateNAtten(thirdData.rightXHC[0]),
      zjgb_14_z: calculateNAtten(fourthData.leftXHC[0]),
      zjgb_14_y: calculateNAtten(fourthData.rightXHC[0]),
      zjgb_15_z: calculateNAtten(fifthData.leftXHC[0]),
      zjgb_15_y: calculateNAtten(fifthData.rightXHC[0]),
      zjgb_1cz_z: calculateNAttenDiff(
        firstData.leftXHC[0],
        secondData.leftXHC[0],
        thirdData.leftXHC[0],
        fourthData.leftXHC[0],
        fifthData.leftXHC[0],
      ),
      zjgb_1cz_y: calculateNAttenDiff(
        firstData.rightXHC[0],
        secondData.rightXHC[0],
        thirdData.rightXHC[0],
        fourthData.rightXHC[0],
        fifthData.rightXHC[0],
      ),
      zjgb_1jg: calculateQuartorResult(
        firstData.rightXHC[0],
        secondData.rightXHC[0],
        thirdData.rightXHC[0],
        fourthData.rightXHC[0],
        fifthData.rightXHC[0],
      ),
      zjgb_21_z: calculateNAtten(firstData.leftXHC[1]),
      zjgb_21_y: calculateNAtten(firstData.rightXHC[1]),
      zjgb_22_z: calculateNAtten(secondData.leftXHC[1]),
      zjgb_22_y: calculateNAtten(secondData.rightXHC[1]),
      zjgb_23_z: calculateNAtten(thirdData.leftXHC[1]),
      zjgb_23_y: calculateNAtten(thirdData.rightXHC[1]),
      zjgb_24_z: calculateNAtten(fourthData.leftXHC[1]),
      zjgb_24_y: calculateNAtten(fourthData.rightXHC[1]),
      zjgb_25_z: calculateNAtten(fifthData.leftXHC[1]),
      zjgb_25_y: calculateNAtten(fifthData.rightXHC[1]),
      zjgb_2cz_z: calculateNAttenDiff(
        firstData.leftXHC[1],
        secondData.leftXHC[1],
        thirdData.leftXHC[1],
        fourthData.leftXHC[1],
        fifthData.leftXHC[1],
      ),
      zjgb_2cz_y: calculateNAttenDiff(
        firstData.rightXHC[1],
        secondData.rightXHC[1],
        thirdData.rightXHC[1],
        fourthData.rightXHC[1],
        fifthData.rightXHC[1],
      ),
      zjgb_2jg: calculateQuartorResult(
        firstData.rightXHC[1],
        secondData.rightXHC[1],
        thirdData.rightXHC[1],
        fourthData.rightXHC[1],
        fifthData.rightXHC[1],
      ),
      zjgb_31_z: calculateNAtten(firstData.leftXHC[2]),
      zjgb_31_y: calculateNAtten(firstData.rightXHC[2]),
      zjgb_32_z: calculateNAtten(secondData.leftXHC[2]),
      zjgb_32_y: calculateNAtten(secondData.rightXHC[2]),
      zjgb_33_z: calculateNAtten(thirdData.leftXHC[2]),
      zjgb_33_y: calculateNAtten(thirdData.rightXHC[2]),
      zjgb_34_z: calculateNAtten(fourthData.leftXHC[2]),
      zjgb_34_y: calculateNAtten(fourthData.rightXHC[2]),
      zjgb_35_z: calculateNAtten(fifthData.leftXHC[2]),
      zjgb_35_y: calculateNAtten(fifthData.rightXHC[2]),
      zjgb_3cz_z: calculateNAttenDiff(
        firstData.leftXHC[2],
        secondData.leftXHC[2],
        thirdData.leftXHC[2],
        fourthData.leftXHC[2],
        fifthData.leftXHC[2],
      ),
      zjgb_3cz_y: calculateNAttenDiff(
        firstData.rightXHC[2],
        secondData.rightXHC[2],
        thirdData.rightXHC[2],
        fourthData.rightXHC[2],
        fifthData.rightXHC[2],
      ),
      zjgb_3jg: calculateQuartorResult(
        firstData.rightXHC[2],
        secondData.rightXHC[2],
        thirdData.rightXHC[2],
        fourthData.rightXHC[2],
        fifthData.rightXHC[2],
      ),
      lzxrb_11_z: calculateNAtten(firstData.leftLZ[0]),
      lzxrb_11_y: calculateNAtten(firstData.rightLZ[0]),
      lzxrb_12_z: calculateNAtten(secondData.leftLZ[0]),
      lzxrb_12_y: calculateNAtten(secondData.rightLZ[0]),
      lzxrb_13_z: calculateNAtten(thirdData.leftLZ[0]),
      lzxrb_13_y: calculateNAtten(thirdData.rightLZ[0]),
      lzxrb_14_z: calculateNAtten(fourthData.leftLZ[0]),
      lzxrb_14_y: calculateNAtten(fourthData.rightLZ[0]),
      lzxrb_15_z: calculateNAtten(fifthData.leftLZ[0]),
      lzxrb_15_y: calculateNAtten(fifthData.rightLZ[0]),
      lzxrb_1cz_z: calculateNAttenDiff(
        firstData.leftLZ[0],
        secondData.leftLZ[0],
        thirdData.leftLZ[0],
        fourthData.leftLZ[0],
        fifthData.leftLZ[0],
      ),
      lzxrb_1cz_y: calculateNAttenDiff(
        firstData.rightLZ[0],
        secondData.rightLZ[0],
        thirdData.rightLZ[0],
        fourthData.rightLZ[0],
        fifthData.rightLZ[0],
      ),
      lzxrb_1jg: calculateQuartorResult(
        firstData.rightLZ[0],
        secondData.rightLZ[0],
        thirdData.rightLZ[0],
        fourthData.rightLZ[0],
        fifthData.rightLZ[0],
      ),
      lzxrb_21_z: calculateNAtten(firstData.leftLZ[1]),
      lzxrb_21_y: calculateNAtten(firstData.rightLZ[1]),
      lzxrb_22_z: calculateNAtten(secondData.leftLZ[1]),
      lzxrb_22_y: calculateNAtten(secondData.rightLZ[1]),
      lzxrb_23_z: calculateNAtten(thirdData.leftLZ[1]),
      lzxrb_23_y: calculateNAtten(thirdData.rightLZ[1]),
      lzxrb_24_z: calculateNAtten(fourthData.leftLZ[1]),
      lzxrb_24_y: calculateNAtten(fourthData.rightLZ[1]),
      lzxrb_25_z: calculateNAtten(fifthData.leftLZ[1]),
      lzxrb_25_y: calculateNAtten(fifthData.rightLZ[1]),
      lzxrb_2cz_z: calculateNAttenDiff(
        firstData.leftLZ[1],
        secondData.leftLZ[1],
        thirdData.leftLZ[1],
        fourthData.leftLZ[1],
        fifthData.leftLZ[1],
      ),
      lzxrb_2cz_y: calculateNAttenDiff(
        firstData.rightLZ[1],
        secondData.rightLZ[1],
        thirdData.rightLZ[1],
        fourthData.rightLZ[1],
        fifthData.rightLZ[1],
      ),
      lzxrb_2jg: calculateQuartorResult(
        firstData.rightLZ[1],
        secondData.rightLZ[1],
        thirdData.rightLZ[1],
        fourthData.rightLZ[1],
        fifthData.rightLZ[1],
      ),
      lzxrb_31_z: calculateNAtten(firstData.leftLZ[2]),
      lzxrb_31_y: calculateNAtten(firstData.rightLZ[2]),
      lzxrb_32_z: calculateNAtten(secondData.leftLZ[2]),
      lzxrb_32_y: calculateNAtten(secondData.rightLZ[2]),
      lzxrb_33_z: calculateNAtten(thirdData.leftLZ[2]),
      lzxrb_33_y: calculateNAtten(thirdData.rightLZ[2]),
      lzxrb_34_z: calculateNAtten(fourthData.leftLZ[2]),
      lzxrb_34_y: calculateNAtten(fourthData.rightLZ[2]),
      lzxrb_35_z: calculateNAtten(fifthData.leftLZ[2]),
      lzxrb_35_y: calculateNAtten(fifthData.rightLZ[2]),
      lzxrb_3cz_z: calculateNAttenDiff(
        firstData.leftLZ[2],
        secondData.leftLZ[2],
        thirdData.leftLZ[2],
        fourthData.leftLZ[2],
        fifthData.leftLZ[2],
      ),
      lzxrb_3cz_y: calculateNAttenDiff(
        firstData.rightLZ[2],
        secondData.rightLZ[2],
        thirdData.rightLZ[2],
        fourthData.rightLZ[2],
        fifthData.rightLZ[2],
      ),
      lzxrb_3jg: calculateQuartorResult(
        firstData.rightLZ[2],
        secondData.rightLZ[2],
        thirdData.rightLZ[2],
        fourthData.rightLZ[2],
        fifthData.rightLZ[2],
      ),
      lzxrb_41_z: calculateNAtten(firstData.leftLZ[3]),
      lzxrb_41_y: calculateNAtten(firstData.rightLZ[3]),
      lzxrb_42_z: calculateNAtten(secondData.leftLZ[3]),
      lzxrb_42_y: calculateNAtten(secondData.rightLZ[3]),
      lzxrb_43_z: calculateNAtten(thirdData.leftLZ[3]),
      lzxrb_43_y: calculateNAtten(thirdData.rightLZ[3]),
      lzxrb_44_z: calculateNAtten(fourthData.leftLZ[3]),
      lzxrb_44_y: calculateNAtten(fourthData.rightLZ[3]),
      lzxrb_45_z: calculateNAtten(fifthData.leftLZ[3]),
      lzxrb_45_y: calculateNAtten(fifthData.rightLZ[3]),
      lzxrb_4cz_z: calculateNAttenDiff(
        firstData.leftLZ[3],
        secondData.leftLZ[3],
        thirdData.leftLZ[3],
        fourthData.leftLZ[3],
        fifthData.leftLZ[3],
      ),
      lzxrb_4cz_y: calculateNAttenDiff(
        firstData.rightLZ[3],
        secondData.rightLZ[3],
        thirdData.rightLZ[3],
        fourthData.rightLZ[3],
        fifthData.rightLZ[3],
      ),
      lzxrb_4jg: calculateQuartorResult(
        firstData.rightLZ[3],
        secondData.rightLZ[3],
        thirdData.rightLZ[3],
        fourthData.rightLZ[3],
        fifthData.rightLZ[3],
      ),
      lzxrb_51_z: calculateNAtten(firstData.leftLZ[4]),
      lzxrb_51_y: calculateNAtten(firstData.rightLZ[4]),
      lzxrb_52_z: calculateNAtten(secondData.leftLZ[4]),
      lzxrb_52_y: calculateNAtten(secondData.rightLZ[4]),
      lzxrb_53_z: calculateNAtten(thirdData.leftLZ[4]),
      lzxrb_53_y: calculateNAtten(thirdData.rightLZ[4]),
      lzxrb_54_z: calculateNAtten(fourthData.leftLZ[4]),
      lzxrb_54_y: calculateNAtten(fourthData.rightLZ[4]),
      lzxrb_55_z: calculateNAtten(fifthData.leftLZ[4]),
      lzxrb_55_y: calculateNAtten(fifthData.rightLZ[4]),
      lzxrb_5cz_z: calculateNAttenDiff(
        firstData.leftLZ[4],
        secondData.leftLZ[4],
        thirdData.leftLZ[4],
        fourthData.leftLZ[4],
        fifthData.leftLZ[4],
      ),
      lzxrb_5cz_y: calculateNAttenDiff(
        firstData.rightLZ[4],
        secondData.rightLZ[4],
        thirdData.rightLZ[4],
        fourthData.rightLZ[4],
        fifthData.rightLZ[4],
      ),
      lzxrb_5jg: calculateQuartorResult(
        firstData.rightLZ[4],
        secondData.rightLZ[4],
        thirdData.rightLZ[4],
        fourthData.rightLZ[4],
        fifthData.rightLZ[4],
      ),
      lzxrb_61_z: calculateNAtten(firstData.leftLZ[5]),
      lzxrb_61_y: calculateNAtten(firstData.rightLZ[5]),
      lzxrb_62_z: calculateNAtten(secondData.leftLZ[5]),
      lzxrb_62_y: calculateNAtten(secondData.rightLZ[5]),
      lzxrb_63_z: calculateNAtten(thirdData.leftLZ[5]),
      lzxrb_63_y: calculateNAtten(thirdData.rightLZ[5]),
      lzxrb_64_z: calculateNAtten(fourthData.leftLZ[5]),
      lzxrb_64_y: calculateNAtten(fourthData.rightLZ[5]),
      lzxrb_65_z: calculateNAtten(fifthData.leftLZ[5]),
      lzxrb_65_y: calculateNAtten(fifthData.rightLZ[5]),
      lzxrb_6cz_z: calculateNAttenDiff(
        firstData.leftLZ[5],
        secondData.leftLZ[5],
        thirdData.leftLZ[5],
        fourthData.leftLZ[5],
        fifthData.leftLZ[5],
      ),
      lzxrb_6cz_y: calculateNAttenDiff(
        firstData.rightLZ[5],
        secondData.rightLZ[5],
        thirdData.rightLZ[5],
        fourthData.rightLZ[5],
        fifthData.rightLZ[5],
      ),
      lzxrb_6jg: calculateQuartorResult(
        firstData.rightLZ[5],
        secondData.rightLZ[5],
        thirdData.rightLZ[5],
        fourthData.rightLZ[5],
        fifthData.rightLZ[5],
      ),
      lzxrb_71_z: calculateNAtten(firstData.leftLZ[6]),
      lzxrb_71_y: calculateNAtten(firstData.rightLZ[6]),
      lzxrb_72_z: calculateNAtten(secondData.leftLZ[6]),
      lzxrb_72_y: calculateNAtten(secondData.rightLZ[6]),
      lzxrb_73_z: calculateNAtten(thirdData.leftLZ[6]),
      lzxrb_73_y: calculateNAtten(thirdData.rightLZ[6]),
      lzxrb_74_z: calculateNAtten(fourthData.leftLZ[6]),
      lzxrb_74_y: calculateNAtten(fourthData.rightLZ[6]),
      lzxrb_75_z: calculateNAtten(fifthData.leftLZ[6]),
      lzxrb_75_y: calculateNAtten(fifthData.rightLZ[6]),
      lzxrb_7cz_z: calculateNAttenDiff(
        firstData.leftLZ[6],
        secondData.leftLZ[6],
        thirdData.leftLZ[6],
        fourthData.leftLZ[6],
        fifthData.leftLZ[6],
      ),
      lzxrb_7cz_y: calculateNAttenDiff(
        firstData.rightLZ[6],
        secondData.rightLZ[6],
        thirdData.rightLZ[6],
        fourthData.rightLZ[6],
        fifthData.rightLZ[6],
      ),
      lzxrb_7jg: calculateQuartorResult(
        firstData.rightLZ[6],
        secondData.rightLZ[6],
        thirdData.rightLZ[6],
        fourthData.rightLZ[6],
        fifthData.rightLZ[6],
      ),
      lzxrb_81_z: calculateNAtten(firstData.leftLZ[7]),
      lzxrb_81_y: calculateNAtten(firstData.rightLZ[7]),
      lzxrb_82_z: calculateNAtten(secondData.leftLZ[7]),
      lzxrb_82_y: calculateNAtten(secondData.rightLZ[7]),
      lzxrb_83_z: calculateNAtten(thirdData.leftLZ[7]),
      lzxrb_83_y: calculateNAtten(thirdData.rightLZ[7]),
      lzxrb_84_z: calculateNAtten(fourthData.leftLZ[7]),
      lzxrb_84_y: calculateNAtten(fourthData.rightLZ[7]),
      lzxrb_85_z: calculateNAtten(fifthData.leftLZ[7]),
      lzxrb_85_y: calculateNAtten(fifthData.rightLZ[7]),
      lzxrb_8cz_z: calculateNAttenDiff(
        firstData.leftLZ[7],
        secondData.leftLZ[7],
        thirdData.leftLZ[7],
        fourthData.leftLZ[7],
        fifthData.leftLZ[7],
      ),
      lzxrb_8cz_y: calculateNAttenDiff(
        firstData.rightLZ[7],
        secondData.rightLZ[7],
        thirdData.rightLZ[7],
        fourthData.rightLZ[7],
        fifthData.rightLZ[7],
      ),
      lzxrb_8jg: calculateQuartorResult(
        firstData.rightLZ[7],
        secondData.rightLZ[7],
        thirdData.rightLZ[7],
        fourthData.rightLZ[7],
        fifthData.rightLZ[7],
      ),
      lzxrb_91_z: calculateNAtten(firstData.leftLZ[8]),
      lzxrb_91_y: calculateNAtten(firstData.rightLZ[8]),
      lzxrb_92_z: calculateNAtten(secondData.leftLZ[8]),
      lzxrb_92_y: calculateNAtten(secondData.rightLZ[8]),
      lzxrb_93_z: calculateNAtten(thirdData.leftLZ[8]),
      lzxrb_93_y: calculateNAtten(thirdData.rightLZ[8]),
      lzxrb_94_z: calculateNAtten(fourthData.leftLZ[8]),
      lzxrb_94_y: calculateNAtten(fourthData.rightLZ[8]),
      lzxrb_95_z: calculateNAtten(fifthData.leftLZ[8]),
      lzxrb_95_y: calculateNAtten(fifthData.rightLZ[8]),
      lzxrb_9cz_z: calculateNAttenDiff(
        firstData.leftLZ[8],
        secondData.leftLZ[8],
        thirdData.leftLZ[8],
        fourthData.leftLZ[8],
        fifthData.leftLZ[8],
      ),
      lzxrb_9cz_y: calculateNAttenDiff(
        firstData.rightLZ[8],
        secondData.rightLZ[8],
        thirdData.rightLZ[8],
        fourthData.rightLZ[8],
        fifthData.rightLZ[8],
      ),
      lzxrb_9jg: calculateQuartorResult(
        firstData.rightLZ[8],
        secondData.rightLZ[8],
        thirdData.rightLZ[8],
        fourthData.rightLZ[8],
        fifthData.rightLZ[8],
      ),
      lzxrb_101_z: calculateNAtten(firstData.leftLZ[9]),
      lzxrb_101_y: calculateNAtten(firstData.rightLZ[9]),
      lzxrb_102_z: calculateNAtten(secondData.leftLZ[9]),
      lzxrb_102_y: calculateNAtten(secondData.rightLZ[9]),
      lzxrb_103_z: calculateNAtten(thirdData.leftLZ[9]),
      lzxrb_103_y: calculateNAtten(thirdData.rightLZ[9]),
      lzxrb_104_z: calculateNAtten(fourthData.leftLZ[9]),
      lzxrb_104_y: calculateNAtten(fourthData.rightLZ[9]),
      lzxrb_105_z: calculateNAtten(fifthData.leftLZ[9]),
      lzxrb_105_y: calculateNAtten(fifthData.rightLZ[9]),
      lzxrb_10cz_z: calculateNAttenDiff(
        firstData.leftLZ[9],
        secondData.leftLZ[9],
        thirdData.leftLZ[9],
        fourthData.leftLZ[9],
        fifthData.leftLZ[9],
      ),
      lzxrb_10cz_y: calculateNAttenDiff(
        firstData.rightLZ[9],
        secondData.rightLZ[9],
        thirdData.rightLZ[9],
        fourthData.rightLZ[9],
        fifthData.rightLZ[9],
      ),
      lzxrb_10jg: calculateQuartorResult(
        firstData.rightLZ[9],
        secondData.rightLZ[9],
        thirdData.rightLZ[9],
        fourthData.rightLZ[9],
        fifthData.rightLZ[9],
      ),
      lzxrb_111_z: calculateNAtten(firstData.leftLZ[10]),
      lzxrb_111_y: calculateNAtten(firstData.rightLZ[10]),
      lzxrb_112_z: calculateNAtten(secondData.leftLZ[10]),
      lzxrb_112_y: calculateNAtten(secondData.rightLZ[10]),
      lzxrb_113_z: calculateNAtten(thirdData.leftLZ[10]),
      lzxrb_113_y: calculateNAtten(thirdData.rightLZ[10]),
      lzxrb_114_z: calculateNAtten(fourthData.leftLZ[10]),
      lzxrb_114_y: calculateNAtten(fourthData.rightLZ[10]),
      lzxrb_115_z: calculateNAtten(fifthData.leftLZ[10]),
      lzxrb_115_y: calculateNAtten(fifthData.rightLZ[10]),
      lzxrb_11cz_z: calculateNAttenDiff(
        firstData.leftLZ[10],
        secondData.leftLZ[10],
        thirdData.leftLZ[10],
        fourthData.leftLZ[10],
        fifthData.leftLZ[10],
      ),
      lzxrb_11cz_y: calculateNAttenDiff(
        firstData.rightLZ[10],
        secondData.rightLZ[10],
        thirdData.rightLZ[10],
        fourthData.rightLZ[10],
        fifthData.rightLZ[10],
      ),
      lzxrb_11jg: calculateQuartorResult(
        firstData.rightLZ[10],
        secondData.rightLZ[10],
        thirdData.rightLZ[10],
        fourthData.rightLZ[10],
        fifthData.rightLZ[10],
      ),
      qzct_11_z: calculateNAtten(firstData.leftCT[0]),
      qzct_11_y: calculateNAtten(firstData.rightCT[0]),
      qzct_12_z: calculateNAtten(secondData.leftCT[0]),
      qzct_12_y: calculateNAtten(secondData.rightCT[0]),
      qzct_13_z: calculateNAtten(thirdData.leftCT[0]),
      qzct_13_y: calculateNAtten(thirdData.rightCT[0]),
      qzct_14_z: calculateNAtten(fourthData.leftCT[0]),
      qzct_14_y: calculateNAtten(fourthData.rightCT[0]),
      qzct_15_z: calculateNAtten(fifthData.leftCT[0]),
      qzct_15_y: calculateNAtten(fifthData.rightCT[0]),
      qzct_1cz_z: calculateNAttenDiff(
        firstData.leftCT[0],
        secondData.leftCT[0],
        thirdData.leftCT[0],
        fourthData.leftCT[0],
        fifthData.leftCT[0],
      ),
      qzct_1cz_y: calculateNAttenDiff(
        firstData.rightCT[0],
        secondData.rightCT[0],
        thirdData.rightCT[0],
        fourthData.rightCT[0],
        fifthData.rightCT[0],
      ),
      qzct_1jg: calculateQuartorResult(
        firstData.rightCT[0],
        secondData.rightCT[0],
        thirdData.rightCT[0],
        fourthData.rightCT[0],
        fifthData.rightCT[0],
      ),
      tsg,
      gz: store.tsgz,
      zjy: store.tszjy,
      ysy: store.tsysy,
      wxg: store.tswxg,
      sbzz: store.sbzz,
      tszz: store.tszz,
      zgld: store.zgld,
      bz: "",
    };
  }
  async resolveCHR503InputParams(
    rows: QuartorYearlyData[],
  ): Promise<CHR503InputParams> {
    const store = this.getStore();
    const corporation = await this.mdb.getCorporation();
    const channelGroup = createNChannelGroup(rows);
    const left1 = channelGroup.left1[0];
    const left2 = channelGroup.left2[0];
    const left3 = channelGroup.left3[0];
    const left4 = channelGroup.left4[0];
    const left5 = channelGroup.left5[0];
    const right7 = channelGroup.right7[0];
    const right8 = channelGroup.right8[0];
    const right9 = channelGroup.right9[0];
    const right10 = channelGroup.right10[0];
    const right11 = channelGroup.right11[0];

    return {
      xrsj: dayjs(left1.tmNow).format("YYYY-MM-DD HH:mm:ss"),
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      ggxh: corporation.DeviceType || "",
      zzcj: "武汉武铁紫云轨道装备有限公司",
      dwmc: corporation.Factory || "",
      jyrq: dayjs(left1.tmNow).format("YYYY-MM-DD"),
      cl11: mathjs.format(left1.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl12: calculateDecResult(left1.Dec_Max),
      cl13: mathjs.format(left1.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl14: calculateAttResult(left1.Att_Max),
      jg1: left1.bResult ? "合格" : "不合格",
      cl21: mathjs.format(left2.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl22: calculateDecResult(left2.Dec_Max),
      cl23: mathjs.format(left2.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl24: calculateAttResult(left2.Att_Max),
      jg2: left2.bResult ? "合格" : "不合格",
      cl31: mathjs.format(left3.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl32: calculateDecResult(left3.Dec_Max),
      cl33: mathjs.format(left3.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl34: calculateAttResult(left3.Att_Max),
      jg3: left3.bResult ? "合格" : "不合格",
      cl41: mathjs.format(left4.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl42: calculateDecResult(left4.Dec_Max),
      cl43: mathjs.format(left4.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl44: calculateAttResult(left4.Att_Max),
      jg4: left4.bResult ? "合格" : "不合格",
      cl51: mathjs.format(left5.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl52: calculateDecResult(left5.Dec_Max),
      cl53: mathjs.format(left5.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl54: calculateAttResult(left5.Att_Max),
      jg5: left5.bResult ? "合格" : "不合格",
      cl61: mathjs.format(right7.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl62: calculateDecResult(right7.Dec_Max),
      cl63: mathjs.format(right7.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl64: calculateAttResult(right7.Att_Max),
      jg6: right7.bResult ? "合格" : "不合格",
      cl71: mathjs.format(right8.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl72: calculateDecResult(right8.Dec_Max),
      cl73: mathjs.format(right8.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl74: calculateAttResult(right8.Att_Max),
      jg7: right8.bResult ? "合格" : "不合格",
      cl81: mathjs.format(right9.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl82: calculateDecResult(right9.Dec_Max),
      cl83: mathjs.format(right9.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl84: calculateAttResult(right9.Att_Max),
      jg8: right9.bResult ? "合格" : "不合格",
      cl91: mathjs.format(right10.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl92: calculateDecResult(right10.Dec_Max),
      cl93: mathjs.format(right10.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl94: calculateAttResult(right10.Att_Max),
      jg9: right10.bResult ? "合格" : "不合格",
      cl101: mathjs.format(right11.Hor_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl102: calculateDecResult(right11.Dec_Max),
      cl103: mathjs.format(right11.Ver_fResult, {
        notation: "fixed",
        precision: 2,
      }),
      cl104: calculateAttResult(right11.Att_Max),
      jg10: right11.bResult ? "合格" : "不合格",
      tsg: left1.szUsername,
      gz: store.tsgz,
      zjy: store.tszjy,
      ysy: store.tsysy,
      wxg: store.tswxg,
      sbzz: store.sbzz,
      tszz: store.tszz,
      zgld: store.zgld,
      bz: "",
    };
  }

  async resolveFlawData(flaw: VerifyData, record: Verify) {
    if (!record.szWHModel) {
      throw new Error("记录缺少机型信息，无法解析缺陷数据");
    }

    const detector = await this.mdb.getDetector(
      flaw.nChannel,
      flaw.nBoard,
      record.szWHModel,
    );

    return {
      flaw,
      detector,
      zsj: calculateZSJ(detector.nWAngle),
      jy: calculateJY(flaw.nAtten),
      ts: calculateTS(flaw.nAtten, detector.nDBSub),
    };
  }
  createFlawTasks(flaws: VerifyData[], record: Verify) {
    const limit = pLimit(os.cpus().length);
    return flaws.map((flaw) => limit(() => this.resolveFlawData(flaw, record)));
  }
}

export interface Ipc {
  "HMIS/kh_hmis_api_get": {
    args: [string];
    return: ReturnType<typeof KH.prototype.handleFetch>;
  };
  "HMIS/kh_hmis_api_set": {
    args: [number];
    return: ReturnType<typeof KH.prototype.handleUpload>;
  };
  "HMIS/kh_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<typeof KH.prototype.handleReadRecord>;
  };
  "HMIS/kh_hmis_sqlite_delete": {
    args: [number];
    return: ReturnType<typeof KH.prototype.handleDeleteRecord>;
  };
  "HMIS/kh_hmis_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<typeof KH.prototype.handleInsertRecord>;
  };
  "HMIS/kh_hmis_chr501": {
    args: [string];
    return: ReturnType<typeof KH.prototype.handleUploadCHR501>;
  };
  "HMIS/kh_hmis_chr502": {
    args: [string[]];
    return: ReturnType<typeof KH.prototype.handleUploadCHR502>;
  };
  "HMIS/kh_hmis_chr503": {
    args: [string];
    return: ReturnType<typeof KH.prototype.handleUploadCHR503>;
  };
}

export const bindIpcHandlers = (hmis: KH, ipcHandle: IpcHandle) => {
  ipcHandle("HMIS/kh_hmis_sqlite_get", (_, params) => {
    return hmis.handleReadRecord(params);
  });
  ipcHandle("HMIS/kh_hmis_sqlite_delete", (_, id) => {
    return hmis.handleDeleteRecord(id);
  });
  ipcHandle("HMIS/kh_hmis_sqlite_insert", (_, params) => {
    return hmis.handleInsertRecord(params);
  });
  ipcHandle("HMIS/kh_hmis_api_get", (_, barcode) => hmis.handleFetch(barcode));
  ipcHandle("HMIS/kh_hmis_api_set", (_, id) => hmis.handleUpload(id));
  ipcHandle("HMIS/kh_hmis_chr501", (_, id) => hmis.handleUploadCHR501(id));
  ipcHandle("HMIS/kh_hmis_chr502", (_, id) => hmis.handleUploadCHR502(id));
  ipcHandle("HMIS/kh_hmis_chr503", (_, id) => hmis.handleUploadCHR503(id));
};
