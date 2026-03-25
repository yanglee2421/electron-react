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
import { FlawQuery } from "#shared/factories/Flaw";
import {
  calculateAttResult,
  calculateDecResult,
  calculateNAttenDiff,
  calculateQuartorResult,
  calculateXHCChNo,
  createNChannelGroup,
} from "#shared/functions/flawDetection";
import { KH_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import type { KH_HMIS } from "#shared/instances/schema";
import { kh_hmis } from "#shared/instances/schema";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import * as mathjs from "mathjs";
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
    const flawQuery = new FlawQuery(record.with);
    flawQuery.left().lz().check();
    flawQuery.right().lz().check();
    flawQuery.left().xhc().check();
    flawQuery.right().xhc().check();
    flawQuery.left().ct().check();
    flawQuery.right().ct().check();
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
      zjy1: flawQuery.left().lz().deg51().flawAtten(1),
      zbc1: detectorMap.bc(0, 3),
      zts1: detectorMap.ts(0, 3, flawQuery.left().lz().deg51().flaw(1)?.nAtten),
      yzsj1: detectorMap.zsj(1, 3),
      yjy1: flawQuery.right().lz().deg51().flawAtten(1),
      ybc1: detectorMap.bc(1, 3),
      yts1: detectorMap.ts(
        1,
        3,
        flawQuery.right().lz().deg51().flaw(1)?.nAtten,
      ),
      zzsj2: detectorMap.zsj(0, 4),
      zjy2: flawQuery.left().lz().deg44().flawAtten(1),
      zbc2: detectorMap.bc(0, 4),
      zts2: detectorMap.ts(0, 4, flawQuery.left().lz().deg44().flaw(1)?.nAtten),
      yzsj2: detectorMap.zsj(1, 4),
      yjy2: flawQuery.right().lz().deg44().flawAtten(1),
      ybc2: detectorMap.bc(1, 4),
      yts2: detectorMap.ts(
        1,
        4,
        flawQuery.right().lz().deg44().flaw(1)?.nAtten,
      ),

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
      zzj_jy1: flawQuery.left().xhc().flawAtten(1),
      zzj_bc1: detectorMap.bc(0, 1),
      zzj_ts1: detectorMap.ts(0, 1, flawQuery.left().xhc().flaw(1)?.nAtten),
      yzj_zsj1: detectorMap.zsj(1, 1),
      yzj_jy1: flawQuery.right().xhc().flawAtten(1),
      yzj_bc1: detectorMap.bc(1, 1),
      yzj_ts1: detectorMap.ts(1, 1, flawQuery.right().xhc().flaw(1)?.nAtten),

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
      zct_jy1: flawQuery.left().ct().flawAtten(),
      zct_bc1: detectorMap.bc(0, 0),
      zct_ts1: detectorMap.ts(0, 0, flawQuery.left().ct().flaw(0)?.nAtten),
      yct_zsj1: detectorMap.zsj(1, 0),
      yct_jy1: flawQuery.right().ct().flawAtten(),
      yct_bc1: detectorMap.bc(1, 0),
      yct_ts1: detectorMap.ts(1, 0, flawQuery.right().ct().flaw(0)?.nAtten),

      // 缺陷
      zqx1_1: flawQuery.left().lz().deg51().flawX(1),
      zqx1_2: flawQuery.left().lz().deg44().flawX(1),
      zqx1_3: "",
      zqx1_4: "",
      zqx1_5: "",
      yqx1_1: flawQuery.right().lz().deg51().flawX(1),
      yqx1_2: flawQuery.right().lz().deg44().flawX(1),
      yqx1_3: "",
      yqx1_4: "",
      yqx1_5: "",
      zqx2_1: flawQuery.left().lz().deg51().flawX(2),
      zqx2_2: flawQuery.left().lz().deg44().flawX(2),
      zqx2_3: "",
      zqx2_4: "",
      zqx2_5: "",
      yqx2_1: flawQuery.right().lz().deg51().flawX(2),
      yqx2_2: flawQuery.right().lz().deg44().flawX(2),
      yqx2_3: "",
      yqx2_4: "",
      yqx2_5: "",
      zqx3_1: flawQuery.left().lz().deg51().flawX(3),
      zqx3_2: flawQuery.left().lz().deg44().flawX(3),
      zqx3_3: "",
      zqx3_4: "",
      zqx3_5: "",
      yqx3_1: flawQuery.right().lz().deg51().flawX(3),
      yqx3_2: flawQuery.right().lz().deg44().flawX(3),
      yqx3_3: "",
      yqx3_4: "",
      yqx3_5: "",
      zqx4_1: flawQuery.left().lz().deg51().flawX(4),
      zqx4_2: flawQuery.left().lz().deg44().flawX(4),
      zqx4_3: "",
      zqx4_4: "",
      zqx4_5: "",
      yqx4_1: flawQuery.right().lz().deg51().flawX(4),
      yqx4_2: flawQuery.right().lz().deg44().flawX(4),
      yqx4_3: "",
      yqx4_4: "",
      yqx4_5: "",
      zqx5_1: flawQuery.left().lz().deg51().flawX(5),
      zqx5_2: flawQuery.left().lz().deg44().flawX(5),
      zqx5_3: "",
      zqx5_4: "",
      zqx5_5: "",
      yqx5_1: flawQuery.right().lz().deg51().flawX(5),
      yqx5_2: flawQuery.right().lz().deg44().flawX(5),
      yqx5_3: "",
      yqx5_4: "",
      yqx5_5: "",
      zqx6_1: flawQuery.left().lz().deg51().flawX(6),
      zqx6_2: flawQuery.left().lz().deg44().flawX(6),
      zqx6_3: "",
      zqx6_4: "",
      zqx6_5: "",
      yqx6_1: flawQuery.right().lz().deg51().flawX(6),
      yqx6_2: flawQuery.right().lz().deg44().flawX(6),
      yqx6_3: "",
      yqx6_4: "",
      yqx6_5: "",
      zqx7_1: flawQuery.left().lz().deg51().flawX(7),
      zqx7_2: flawQuery.left().lz().deg44().flawX(7),
      zqx7_3: "",
      zqx7_4: "",
      zqx7_5: "",
      yqx7_1: flawQuery.right().lz().deg51().flawX(7),
      yqx7_2: flawQuery.right().lz().deg44().flawX(7),
      yqx7_3: "",
      yqx7_4: "",
      yqx7_5: "",
      zqx8_1: flawQuery.left().lz().deg51().flawX(8),
      zqx8_2: flawQuery.left().lz().deg44().flawX(8),
      zqx8_3: "",
      zqx8_4: "",
      zqx8_5: "",
      yqx8_1: flawQuery.right().lz().deg51().flawX(8),
      yqx8_2: flawQuery.right().lz().deg44().flawX(8),
      yqx8_3: "",
      yqx8_4: "",
      yqx8_5: "",
      zqx9_1: flawQuery.left().lz().deg51().flawX(9),
      zqx9_2: flawQuery.left().lz().deg44().flawX(9),
      zqx9_3: "",
      zqx9_4: "",
      zqx9_5: "",
      yqx9_1: flawQuery.right().lz().deg51().flawX(9),
      yqx9_2: flawQuery.right().lz().deg44().flawX(9),
      yqx9_3: "",
      yqx9_4: "",
      yqx9_5: "",
      zqx10_1: flawQuery.left().lz().deg51().flawX(10),
      zqx10_2: flawQuery.left().lz().deg44().flawX(10),
      zqx10_3: "",
      zqx10_4: "",
      zqx10_5: "",
      yqx10_1: flawQuery.right().lz().deg51().flawX(10),
      yqx10_2: flawQuery.right().lz().deg44().flawX(10),
      yqx10_3: "",
      yqx10_4: "",
      yqx10_5: "",
      zqx11_1: flawQuery.left().lz().deg51().flawX(11),
      zqx11_2: flawQuery.left().lz().deg44().flawX(11),
      zqx11_3: "",
      zqx11_4: "",
      zqx11_5: "",
      yqx11_1: flawQuery.right().lz().deg51().flawX(11),
      yqx11_2: flawQuery.right().lz().deg44().flawX(11),
      yqx11_3: "",
      yqx11_4: "",
      yqx11_5: "",

      zzj_qx1_1: flawQuery.left().xhc().flawX(1),
      zzj_qx1_2: "",
      zzj_qx1_3: "",
      yzj_qx1_1: flawQuery.right().xhc().flawX(1),
      yzj_qx1_2: "",
      yzj_qx1_3: "",
      zzj_qx2_1: flawQuery.left().xhc().flawX(2),
      zzj_qx2_2: "",
      zzj_qx2_3: "",
      yzj_qx2_1: flawQuery.right().xhc().flawX(2),
      yzj_qx2_2: "",
      yzj_qx2_3: "",
      zzj_qx3_1: flawQuery.left().xhc().flawX(3),
      zzj_qx3_2: "",
      zzj_qx3_3: "",
      yzj_qx3_1: flawQuery.right().xhc().flawX(3),
      yzj_qx3_2: "",
      yzj_qx3_3: "",
      zct_qx1_1: flawQuery.left().ct().flawX(),
      zct_qx1_2: "",
      zct_qx1_3: "",
      yct_qx1_1: flawQuery.right().ct().flawX(),
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
    const q1 = new FlawQuery(records[0].with, records[0].szIDs);
    const q2 = new FlawQuery(records[1].with, records[1].szIDs);
    const q3 = new FlawQuery(records[2].with, records[2].szIDs);
    const q4 = new FlawQuery(records[3].with, records[3].szIDs);
    const q5 = new FlawQuery(records[4].with, records[4].szIDs);
    const queries = [q1, q2, q3, q4, q5];

    queries.forEach((q) => {
      q.left().xhc().check();
      q.right().xhc().check();
      q.left().lz().check();
      q.left().lz().deg51().check();
      q.left().lz().deg44().check();
      q.right().lz().check();
      q.left().ct().check();
      q.right().ct().check();
    });

    const zjgb_11_z = q1.left().xhc().flawAtten(1);
    const zjgb_11_y = q1.right().xhc().flawAtten(1);
    const zjgb_12_z = q2.left().xhc().flawAtten(1);
    const zjgb_12_y = q2.right().xhc().flawAtten(1);
    const zjgb_13_z = q3.left().xhc().flawAtten(1);
    const zjgb_13_y = q3.right().xhc().flawAtten(1);
    const zjgb_14_z = q4.left().xhc().flawAtten(1);
    const zjgb_14_y = q4.right().xhc().flawAtten(1);
    const zjgb_15_z = q5.left().xhc().flawAtten(1);
    const zjgb_15_y = q5.right().xhc().flawAtten(1);
    const zjgb_21_z = q1.left().xhc().flawAtten(2);
    const zjgb_21_y = q1.right().xhc().flawAtten(2);
    const zjgb_22_z = q2.left().xhc().flawAtten(2);
    const zjgb_22_y = q2.right().xhc().flawAtten(2);
    const zjgb_23_z = q3.left().xhc().flawAtten(2);
    const zjgb_23_y = q3.right().xhc().flawAtten(2);
    const zjgb_24_z = q4.left().xhc().flawAtten(2);
    const zjgb_24_y = q4.right().xhc().flawAtten(2);
    const zjgb_25_z = q5.left().xhc().flawAtten(2);
    const zjgb_25_y = q5.right().xhc().flawAtten(2);
    const zjgb_31_z = q1.left().xhc().flawAtten(3);
    const zjgb_31_y = q1.right().xhc().flawAtten(3);
    const zjgb_32_z = q2.left().xhc().flawAtten(3);
    const zjgb_32_y = q2.right().xhc().flawAtten(3);
    const zjgb_33_z = q3.left().xhc().flawAtten(3);
    const zjgb_33_y = q3.right().xhc().flawAtten(3);
    const zjgb_34_z = q4.left().xhc().flawAtten(3);
    const zjgb_34_y = q4.right().xhc().flawAtten(3);
    const zjgb_35_z = q5.left().xhc().flawAtten(3);
    const zjgb_35_y = q5.right().xhc().flawAtten(3);
    const lzxrb_11_z = q1.left().lz().deg51().flawAtten(1);
    const lzxrb_11_y = q1.right().lz().deg51().flawAtten(1);
    const lzxrb_12_z = q2.left().lz().deg51().flawAtten(1);
    const lzxrb_12_y = q2.right().lz().deg51().flawAtten(1);
    const lzxrb_13_z = q3.left().lz().deg51().flawAtten(1);
    const lzxrb_13_y = q3.right().lz().deg51().flawAtten(1);
    const lzxrb_14_z = q4.left().lz().deg51().flawAtten(1);
    const lzxrb_14_y = q4.right().lz().deg51().flawAtten(1);
    const lzxrb_15_z = q5.left().lz().deg51().flawAtten(1);
    const lzxrb_15_y = q5.right().lz().deg51().flawAtten(1);
    const lzxrb_21_z = q1.left().lz().deg51().flawAtten(2);
    const lzxrb_21_y = q1.right().lz().deg51().flawAtten(2);
    const lzxrb_22_z = q2.left().lz().deg51().flawAtten(2);
    const lzxrb_22_y = q2.right().lz().deg51().flawAtten(2);
    const lzxrb_23_z = q3.left().lz().deg51().flawAtten(2);
    const lzxrb_23_y = q3.right().lz().deg51().flawAtten(2);
    const lzxrb_24_z = q4.left().lz().deg51().flawAtten(2);
    const lzxrb_24_y = q4.right().lz().deg51().flawAtten(2);
    const lzxrb_25_z = q5.left().lz().deg51().flawAtten(2);
    const lzxrb_25_y = q5.right().lz().deg51().flawAtten(2);
    const lzxrb_31_z = q1.left().lz().deg51().flawAtten(3);
    const lzxrb_31_y = q1.right().lz().deg51().flawAtten(3);
    const lzxrb_32_z = q2.left().lz().deg51().flawAtten(3);
    const lzxrb_32_y = q2.right().lz().deg51().flawAtten(3);
    const lzxrb_33_z = q3.left().lz().deg51().flawAtten(3);
    const lzxrb_33_y = q3.right().lz().deg51().flawAtten(3);
    const lzxrb_34_z = q4.left().lz().deg51().flawAtten(3);
    const lzxrb_34_y = q4.right().lz().deg51().flawAtten(3);
    const lzxrb_35_z = q5.left().lz().deg51().flawAtten(3);
    const lzxrb_35_y = q5.right().lz().deg51().flawAtten(3);
    const lzxrb_41_z = q1.left().lz().deg51().flawAtten(4);
    const lzxrb_41_y = q1.right().lz().deg51().flawAtten(4);
    const lzxrb_42_z = q2.left().lz().deg51().flawAtten(4);
    const lzxrb_42_y = q2.right().lz().deg51().flawAtten(4);
    const lzxrb_43_z = q3.left().lz().deg51().flawAtten(4);
    const lzxrb_43_y = q3.right().lz().deg51().flawAtten(4);
    const lzxrb_44_z = q4.left().lz().deg51().flawAtten(4);
    const lzxrb_44_y = q4.right().lz().deg51().flawAtten(4);
    const lzxrb_45_z = q5.left().lz().deg51().flawAtten(4);
    const lzxrb_45_y = q5.right().lz().deg51().flawAtten(4);
    const lzxrb_51_z = q1.left().lz().deg51().flawAtten(5);
    const lzxrb_51_y = q1.right().lz().deg51().flawAtten(5);
    const lzxrb_52_z = q2.left().lz().deg51().flawAtten(5);
    const lzxrb_52_y = q2.right().lz().deg51().flawAtten(5);
    const lzxrb_53_z = q3.left().lz().deg51().flawAtten(5);
    const lzxrb_53_y = q3.right().lz().deg51().flawAtten(5);
    const lzxrb_54_z = q4.left().lz().deg51().flawAtten(5);
    const lzxrb_54_y = q4.right().lz().deg51().flawAtten(5);
    const lzxrb_55_z = q5.left().lz().deg51().flawAtten(5);
    const lzxrb_55_y = q5.right().lz().deg51().flawAtten(5);
    const lzxrb_61_z = q1.left().lz().deg51().flawAtten(6);
    const lzxrb_61_y = q1.right().lz().deg51().flawAtten(6);
    const lzxrb_62_z = q2.left().lz().deg51().flawAtten(6);
    const lzxrb_62_y = q2.right().lz().deg51().flawAtten(6);
    const lzxrb_63_z = q3.left().lz().deg51().flawAtten(6);
    const lzxrb_63_y = q3.right().lz().deg51().flawAtten(6);
    const lzxrb_64_z = q4.left().lz().deg51().flawAtten(6);
    const lzxrb_64_y = q4.right().lz().deg51().flawAtten(6);
    const lzxrb_65_z = q5.left().lz().deg51().flawAtten(6);
    const lzxrb_65_y = q5.right().lz().deg51().flawAtten(6);
    const lzxrb_71_z = q1.left().lz().deg44().flawAtten(7);
    const lzxrb_71_y = q1.right().lz().deg44().flawAtten(7);
    const lzxrb_72_z = q2.left().lz().deg44().flawAtten(7);
    const lzxrb_72_y = q2.right().lz().deg44().flawAtten(7);
    const lzxrb_73_z = q3.left().lz().deg44().flawAtten(7);
    const lzxrb_73_y = q3.right().lz().deg44().flawAtten(7);
    const lzxrb_74_z = q4.left().lz().deg44().flawAtten(7);
    const lzxrb_74_y = q4.right().lz().deg44().flawAtten(7);
    const lzxrb_75_z = q5.left().lz().deg44().flawAtten(7);
    const lzxrb_75_y = q5.right().lz().deg44().flawAtten(7);
    const lzxrb_81_z = q1.left().lz().deg44().flawAtten(8);
    const lzxrb_81_y = q1.right().lz().deg44().flawAtten(8);
    const lzxrb_82_z = q2.left().lz().deg44().flawAtten(8);
    const lzxrb_82_y = q2.right().lz().deg44().flawAtten(8);
    const lzxrb_83_z = q3.left().lz().deg44().flawAtten(8);
    const lzxrb_83_y = q3.right().lz().deg44().flawAtten(8);
    const lzxrb_84_z = q4.left().lz().deg44().flawAtten(8);
    const lzxrb_84_y = q4.right().lz().deg44().flawAtten(8);
    const lzxrb_85_z = q5.left().lz().deg44().flawAtten(8);
    const lzxrb_85_y = q5.right().lz().deg44().flawAtten(8);
    const lzxrb_91_z = q1.left().lz().deg44().flawAtten(9);
    const lzxrb_91_y = q1.right().lz().deg44().flawAtten(9);
    const lzxrb_92_z = q2.left().lz().deg44().flawAtten(9);
    const lzxrb_92_y = q2.right().lz().deg44().flawAtten(9);
    const lzxrb_93_z = q3.left().lz().deg44().flawAtten(9);
    const lzxrb_93_y = q3.right().lz().deg44().flawAtten(9);
    const lzxrb_94_z = q4.left().lz().deg44().flawAtten(9);
    const lzxrb_94_y = q4.right().lz().deg44().flawAtten(9);
    const lzxrb_95_z = q5.left().lz().deg44().flawAtten(9);
    const lzxrb_95_y = q5.right().lz().deg44().flawAtten(9);
    const lzxrb_101_z = q1.left().lz().deg44().flawAtten(10);
    const lzxrb_101_y = q1.right().lz().deg44().flawAtten(10);
    const lzxrb_102_z = q2.left().lz().deg44().flawAtten(10);
    const lzxrb_102_y = q2.right().lz().deg44().flawAtten(10);
    const lzxrb_103_z = q3.left().lz().deg44().flawAtten(10);
    const lzxrb_103_y = q3.right().lz().deg44().flawAtten(10);
    const lzxrb_104_z = q4.left().lz().deg44().flawAtten(10);
    const lzxrb_104_y = q4.right().lz().deg44().flawAtten(10);
    const lzxrb_105_z = q5.left().lz().deg44().flawAtten(10);
    const lzxrb_105_y = q5.right().lz().deg44().flawAtten(10);
    const lzxrb_111_z = q1.left().lz().deg44().flawAtten(11);
    const lzxrb_111_y = q1.right().lz().deg44().flawAtten(11);
    const lzxrb_112_z = q2.left().lz().deg44().flawAtten(11);
    const lzxrb_112_y = q2.right().lz().deg44().flawAtten(11);
    const lzxrb_113_z = q3.left().lz().deg44().flawAtten(11);
    const lzxrb_113_y = q3.right().lz().deg44().flawAtten(11);
    const lzxrb_114_z = q4.left().lz().deg44().flawAtten(11);
    const lzxrb_114_y = q4.right().lz().deg44().flawAtten(11);
    const lzxrb_115_z = q5.left().lz().deg44().flawAtten(11);
    const lzxrb_115_y = q5.right().lz().deg44().flawAtten(11);
    const qzct_11_z = q1.left().ct().flawAtten();
    const qzct_11_y = q1.right().ct().flawAtten();
    const qzct_12_z = q2.left().ct().flawAtten();
    const qzct_12_y = q2.right().ct().flawAtten();
    const qzct_13_z = q3.left().ct().flawAtten();
    const qzct_13_y = q3.right().ct().flawAtten();
    const qzct_14_z = q4.left().ct().flawAtten();
    const qzct_14_y = q4.right().ct().flawAtten();
    const qzct_15_z = q5.left().ct().flawAtten();
    const qzct_15_y = q5.right().ct().flawAtten();
    const zjgb_1cz_z = calculateNAttenDiff(
      zjgb_11_z,
      zjgb_12_z,
      zjgb_13_z,
      zjgb_14_z,
      zjgb_15_z,
    );
    const zjgb_1cz_y = calculateNAttenDiff(
      zjgb_11_y,
      zjgb_12_y,
      zjgb_13_y,
      zjgb_14_y,
      zjgb_15_y,
    );
    const zjgb_2cz_z = calculateNAttenDiff(
      zjgb_21_z,
      zjgb_22_z,
      zjgb_23_z,
      zjgb_24_z,
      zjgb_25_z,
    );
    const zjgb_2cz_y = calculateNAttenDiff(
      zjgb_21_y,
      zjgb_22_y,
      zjgb_23_y,
      zjgb_24_y,
      zjgb_25_y,
    );
    const zjgb_3cz_z = calculateNAttenDiff(
      zjgb_31_z,
      zjgb_32_z,
      zjgb_33_z,
      zjgb_34_z,
      zjgb_35_z,
    );
    const zjgb_3cz_y = calculateNAttenDiff(
      zjgb_31_y,
      zjgb_32_y,
      zjgb_33_y,
      zjgb_34_y,
      zjgb_35_y,
    );
    const qzct_1cz_z = calculateNAttenDiff(
      qzct_11_z,
      qzct_12_z,
      qzct_13_z,
      qzct_14_z,
      qzct_15_z,
    );
    const qzct_1cz_y = calculateNAttenDiff(
      qzct_11_y,
      qzct_12_y,
      qzct_13_y,
      qzct_14_y,
      qzct_15_y,
    );

    return {
      xrsj: dayjs(records[0].tmnow).format("YYYY-MM-DD HH:mm:ss"),
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      dwmc: corporation.Factory || "",
      zzsj: corporation.prodate || "",
      zzdw: "武汉武铁紫云轨道装备有限公司",
      scjxsj: previous ? dayjs(previous.tmnow).format("YYYY-MM-DD") : "",
      jyrq: dayjs(records[0].tmnow).format("YYYY-MM-DD"),
      zjgb_11_z,
      zjgb_11_y,
      zjgb_12_z,
      zjgb_12_y,
      zjgb_13_z,
      zjgb_13_y,
      zjgb_14_z,
      zjgb_14_y,
      zjgb_15_z,
      zjgb_15_y,
      zjgb_1cz_z,
      zjgb_1cz_y,
      zjgb_1jg: calculateQuartorResult(zjgb_1cz_z, zjgb_1cz_y),
      zjgb_21_z,
      zjgb_21_y,
      zjgb_22_z,
      zjgb_22_y,
      zjgb_23_z,
      zjgb_23_y,
      zjgb_24_z,
      zjgb_24_y,
      zjgb_25_z,
      zjgb_25_y,
      zjgb_2cz_z,
      zjgb_2cz_y,
      zjgb_2jg: calculateQuartorResult(zjgb_2cz_z, zjgb_2cz_y),
      zjgb_31_z,
      zjgb_31_y,
      zjgb_32_z,
      zjgb_32_y,
      zjgb_33_z,
      zjgb_33_y,
      zjgb_34_z,
      zjgb_34_y,
      zjgb_35_z,
      zjgb_35_y,
      zjgb_3cz_z: calculateNAttenDiff(
        zjgb_31_z,
        zjgb_32_z,
        zjgb_33_z,
        zjgb_34_z,
        zjgb_35_z,
      ),
      zjgb_3cz_y: calculateNAttenDiff(
        zjgb_31_y,
        zjgb_32_y,
        zjgb_33_y,
        zjgb_34_y,
        zjgb_35_y,
      ),
      zjgb_3jg: calculateQuartorResult(
        zjgb_31_z,
        zjgb_32_z,
        zjgb_33_z,
        zjgb_34_z,
        zjgb_35_z,
        zjgb_31_y,
        zjgb_32_y,
        zjgb_33_y,
        zjgb_34_y,
        zjgb_35_y,
      ),
      lzxrb_11_z,
      lzxrb_11_y,
      lzxrb_12_z,
      lzxrb_12_y,
      lzxrb_13_z,
      lzxrb_13_y,
      lzxrb_14_z,
      lzxrb_14_y,
      lzxrb_15_z,
      lzxrb_15_y,
      lzxrb_1cz_z: calculateNAttenDiff(
        lzxrb_11_z,
        lzxrb_12_z,
        lzxrb_13_z,
        lzxrb_14_z,
        lzxrb_15_z,
      ),
      lzxrb_1cz_y: calculateNAttenDiff(
        lzxrb_11_y,
        lzxrb_12_y,
        lzxrb_13_y,
        lzxrb_14_y,
        lzxrb_15_y,
      ),
      lzxrb_1jg: calculateQuartorResult(
        lzxrb_11_z,
        lzxrb_12_z,
        lzxrb_13_z,
        lzxrb_14_z,
        lzxrb_15_z,
        lzxrb_11_y,
        lzxrb_12_y,
        lzxrb_13_y,
        lzxrb_14_y,
        lzxrb_15_y,
      ),
      lzxrb_21_z,
      lzxrb_21_y,
      lzxrb_22_z,
      lzxrb_22_y,
      lzxrb_23_z,
      lzxrb_23_y,
      lzxrb_24_z,
      lzxrb_24_y,
      lzxrb_25_z,
      lzxrb_25_y,
      lzxrb_2cz_z: calculateNAttenDiff(
        lzxrb_21_z,
        lzxrb_22_z,
        lzxrb_23_z,
        lzxrb_24_z,
        lzxrb_25_z,
      ),
      lzxrb_2cz_y: calculateNAttenDiff(
        lzxrb_21_y,
        lzxrb_22_y,
        lzxrb_23_y,
        lzxrb_24_y,
        lzxrb_25_y,
      ),
      lzxrb_2jg: calculateQuartorResult(
        lzxrb_21_z,
        lzxrb_22_z,
        lzxrb_23_z,
        lzxrb_24_z,
        lzxrb_25_z,
        lzxrb_21_y,
        lzxrb_22_y,
        lzxrb_23_y,
        lzxrb_24_y,
        lzxrb_25_y,
      ),
      lzxrb_31_z,
      lzxrb_31_y,
      lzxrb_32_z,
      lzxrb_32_y,
      lzxrb_33_z,
      lzxrb_33_y,
      lzxrb_34_z,
      lzxrb_34_y,
      lzxrb_35_z,
      lzxrb_35_y,
      lzxrb_3cz_z: calculateNAttenDiff(
        lzxrb_31_z,
        lzxrb_32_z,
        lzxrb_33_z,
        lzxrb_34_z,
        lzxrb_35_z,
      ),
      lzxrb_3cz_y: calculateNAttenDiff(
        lzxrb_31_y,
        lzxrb_32_y,
        lzxrb_33_y,
        lzxrb_34_y,
        lzxrb_35_y,
      ),
      lzxrb_3jg: calculateQuartorResult(
        lzxrb_31_z,
        lzxrb_32_z,
        lzxrb_33_z,
        lzxrb_34_z,
        lzxrb_35_z,
        lzxrb_31_y,
        lzxrb_32_y,
        lzxrb_33_y,
        lzxrb_34_y,
        lzxrb_35_y,
      ),
      lzxrb_41_z,
      lzxrb_41_y,
      lzxrb_42_z,
      lzxrb_42_y,
      lzxrb_43_z,
      lzxrb_43_y,
      lzxrb_44_z,
      lzxrb_44_y,
      lzxrb_45_z,
      lzxrb_45_y,
      lzxrb_4cz_z: calculateNAttenDiff(
        lzxrb_41_z,
        lzxrb_42_z,
        lzxrb_43_z,
        lzxrb_44_z,
        lzxrb_45_z,
      ),
      lzxrb_4cz_y: calculateNAttenDiff(
        lzxrb_41_y,
        lzxrb_42_y,
        lzxrb_43_y,
        lzxrb_44_y,
        lzxrb_45_y,
      ),
      lzxrb_4jg: calculateQuartorResult(
        lzxrb_41_z,
        lzxrb_41_y,
        lzxrb_42_z,
        lzxrb_42_y,
        lzxrb_43_z,
        lzxrb_43_y,
        lzxrb_44_z,
        lzxrb_44_y,
        lzxrb_45_z,
        lzxrb_45_y,
      ),
      lzxrb_51_z,
      lzxrb_51_y,
      lzxrb_52_z,
      lzxrb_52_y,
      lzxrb_53_z,
      lzxrb_53_y,
      lzxrb_54_z,
      lzxrb_54_y,
      lzxrb_55_z,
      lzxrb_55_y,
      lzxrb_5cz_z: calculateNAttenDiff(
        lzxrb_51_z,
        lzxrb_52_z,
        lzxrb_53_z,
        lzxrb_54_z,
        lzxrb_55_z,
      ),
      lzxrb_5cz_y: calculateNAttenDiff(
        lzxrb_51_y,
        lzxrb_52_y,
        lzxrb_53_y,
        lzxrb_54_y,
        lzxrb_55_y,
      ),
      lzxrb_5jg: calculateQuartorResult(
        lzxrb_51_z,
        lzxrb_52_z,
        lzxrb_53_z,
        lzxrb_54_z,
        lzxrb_55_z,
        lzxrb_51_y,
        lzxrb_52_y,
        lzxrb_53_y,
        lzxrb_54_y,
        lzxrb_55_y,
      ),
      lzxrb_61_z,
      lzxrb_61_y,
      lzxrb_62_z,
      lzxrb_62_y,
      lzxrb_63_z,
      lzxrb_63_y,
      lzxrb_64_z,
      lzxrb_64_y,
      lzxrb_65_z,
      lzxrb_65_y,
      lzxrb_6cz_z: calculateNAttenDiff(
        lzxrb_61_z,
        lzxrb_62_z,
        lzxrb_63_z,
        lzxrb_64_z,
        lzxrb_65_z,
      ),
      lzxrb_6cz_y: calculateNAttenDiff(
        lzxrb_61_y,
        lzxrb_62_y,
        lzxrb_63_y,
        lzxrb_64_y,
        lzxrb_65_y,
      ),
      lzxrb_6jg: calculateQuartorResult(
        lzxrb_61_z,
        lzxrb_62_z,
        lzxrb_63_z,
        lzxrb_64_z,
        lzxrb_65_z,
        lzxrb_61_y,
        lzxrb_62_y,
        lzxrb_63_y,
        lzxrb_64_y,
        lzxrb_65_y,
      ),
      lzxrb_71_z,
      lzxrb_71_y,
      lzxrb_72_z,
      lzxrb_72_y,
      lzxrb_73_z,
      lzxrb_73_y,
      lzxrb_74_z,
      lzxrb_74_y,
      lzxrb_75_z,
      lzxrb_75_y,
      lzxrb_7cz_z: calculateNAttenDiff(
        lzxrb_71_z,
        lzxrb_72_z,
        lzxrb_73_z,
        lzxrb_74_z,
        lzxrb_75_z,
      ),
      lzxrb_7cz_y: calculateNAttenDiff(
        lzxrb_71_y,
        lzxrb_72_y,
        lzxrb_73_y,
        lzxrb_74_y,
        lzxrb_75_y,
      ),
      lzxrb_7jg: calculateQuartorResult(
        lzxrb_71_z,
        lzxrb_71_y,
        lzxrb_72_z,
        lzxrb_72_y,
        lzxrb_73_z,
        lzxrb_73_y,
        lzxrb_74_z,
        lzxrb_74_y,
        lzxrb_75_z,
        lzxrb_75_y,
      ),
      lzxrb_81_z,
      lzxrb_81_y,
      lzxrb_82_z,
      lzxrb_82_y,
      lzxrb_83_z,
      lzxrb_83_y,
      lzxrb_84_z,
      lzxrb_84_y,
      lzxrb_85_z,
      lzxrb_85_y,
      lzxrb_8cz_z: calculateNAttenDiff(
        lzxrb_81_z,
        lzxrb_82_z,
        lzxrb_83_z,
        lzxrb_84_z,
        lzxrb_85_z,
      ),
      lzxrb_8cz_y: calculateNAttenDiff(
        lzxrb_81_y,
        lzxrb_82_y,
        lzxrb_83_y,
        lzxrb_84_y,
        lzxrb_85_y,
      ),
      lzxrb_8jg: calculateQuartorResult(
        lzxrb_81_z,
        lzxrb_81_y,
        lzxrb_82_z,
        lzxrb_82_y,
        lzxrb_83_z,
        lzxrb_83_y,
        lzxrb_84_z,
        lzxrb_84_y,
        lzxrb_85_z,
        lzxrb_85_y,
      ),
      lzxrb_91_z,
      lzxrb_91_y,
      lzxrb_92_z,
      lzxrb_92_y,
      lzxrb_93_z,
      lzxrb_93_y,
      lzxrb_94_z,
      lzxrb_94_y,
      lzxrb_95_z,
      lzxrb_95_y,
      lzxrb_9cz_z: calculateNAttenDiff(
        lzxrb_91_z,
        lzxrb_92_z,
        lzxrb_93_z,
        lzxrb_94_z,
        lzxrb_95_z,
      ),
      lzxrb_9cz_y: calculateNAttenDiff(
        lzxrb_91_y,
        lzxrb_92_y,
        lzxrb_93_y,
        lzxrb_94_y,
        lzxrb_95_y,
      ),
      lzxrb_9jg: calculateQuartorResult(
        lzxrb_91_z,
        lzxrb_91_y,
        lzxrb_92_z,
        lzxrb_92_y,
        lzxrb_93_z,
        lzxrb_93_y,
        lzxrb_94_z,
        lzxrb_94_y,
        lzxrb_95_z,
        lzxrb_95_y,
      ),
      lzxrb_101_z,
      lzxrb_101_y,
      lzxrb_102_z,
      lzxrb_102_y,
      lzxrb_103_z,
      lzxrb_103_y,
      lzxrb_104_z,
      lzxrb_104_y,
      lzxrb_105_z,
      lzxrb_105_y,
      lzxrb_10cz_z: calculateNAttenDiff(
        lzxrb_101_z,
        lzxrb_102_z,
        lzxrb_103_z,
        lzxrb_104_z,
        lzxrb_105_z,
      ),
      lzxrb_10cz_y: calculateNAttenDiff(
        lzxrb_101_y,
        lzxrb_102_y,
        lzxrb_103_y,
        lzxrb_104_y,
        lzxrb_105_y,
      ),
      lzxrb_10jg: calculateQuartorResult(
        lzxrb_101_z,
        lzxrb_101_y,
        lzxrb_102_z,
        lzxrb_102_y,
        lzxrb_103_z,
        lzxrb_103_y,
        lzxrb_104_z,
        lzxrb_104_y,
        lzxrb_105_z,
        lzxrb_105_y,
      ),
      lzxrb_111_z,
      lzxrb_111_y,
      lzxrb_112_z,
      lzxrb_112_y,
      lzxrb_113_z,
      lzxrb_113_y,
      lzxrb_114_z,
      lzxrb_114_y,
      lzxrb_115_z,
      lzxrb_115_y,
      lzxrb_11cz_z: calculateNAttenDiff(
        lzxrb_111_z,
        lzxrb_112_z,
        lzxrb_113_z,
        lzxrb_114_z,
        lzxrb_115_z,
      ),
      lzxrb_11cz_y: calculateNAttenDiff(
        lzxrb_111_y,
        lzxrb_112_y,
        lzxrb_113_y,
        lzxrb_114_y,
        lzxrb_115_y,
      ),
      lzxrb_11jg: calculateQuartorResult(
        lzxrb_111_z,
        lzxrb_111_y,
        lzxrb_112_z,
        lzxrb_112_y,
        lzxrb_113_z,
        lzxrb_113_y,
        lzxrb_114_z,
        lzxrb_114_y,
        lzxrb_115_z,
        lzxrb_115_y,
      ),
      qzct_11_z,
      qzct_11_y,
      qzct_12_z,
      qzct_12_y,
      qzct_13_z,
      qzct_13_y,
      qzct_14_z,
      qzct_14_y,
      qzct_15_z,
      qzct_15_y,
      qzct_1cz_z,
      qzct_1cz_y,
      qzct_1jg: calculateQuartorResult(qzct_1cz_z, qzct_1cz_y),
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
