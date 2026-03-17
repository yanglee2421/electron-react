// 康华 安康

import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import { createEmit } from "#main/lib";
import {
  log,
  type InsertRecordParams,
  type IpcHandle,
  type SQLiteGetParams,
} from "#main/lib/ipc";
import type { MDBDB, Verify, VerifyData } from "#main/modules/mdb";
import { HMIS, type Net } from "#main/shared/factories/hmis/hmis";
import type { KV } from "#main/shared/factories/KV";
import {
  calculateJY,
  calculateTS,
  calculateZSJ,
  isCTFlaw,
  isLeftFlaw,
  isLZFlaw,
  isRightFlaw,
  isXHCFlaw,
} from "#shared/functions/flawDetection";
import { KH_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import { kh_hmis, type KH_HMIS } from "#shared/instances/schema";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import pLimit from "p-limit";

interface CHR501InputParams {
  sbbh: string;
  sbmc: string;
  ggxh: string;
  zzcj: string;
  dwmc: string;
  jyrq: string;
  swmkxh: string;
  zlz_zsj1: string;
  zlz_zsj2: string;
  zlz_zsj3: string;
  zlz_zsj4: string;
  zlz_zsj5: string;
  zlz_zsj6: string;
  zlz_zsj7: string;
  zlz_zsj8: string;
  zlz_zsj9: string;
  zlz_zsj10: string;
  zlz_zsj11: string;
  zlz_jy1: string;
  zlz_jy2: string;
  zlz_jy3: string;
  zlz_jy4: string;
  zlz_jy5: string;
  zlz_jy6: string;
  zlz_jy7: string;
  zlz_jy8: string;
  zlz_jy9: string;
  zlz_jy10: string;
  zlz_jy11: string;
  zlz_ts1: string;
  zlz_ts2: string;
  zlz_ts3: string;
  zlz_ts4: string;
  zlz_ts5: string;
  zlz_ts6: string;
  zlz_ts7: string;
  zlz_ts8: string;
  zlz_ts9: string;
  zlz_ts10: string;
  zlz_ts11: string;
  zlz_qx1_1: string;
  zlz_qx1_2: string;
  zlz_qx2_1: string;
  zlz_qx2_2: string;
  zlz_qx2_3: string;
  zlz_qx3_1: string;
  zlz_qx3_3: string;
  zlz_qx3_4: string;
  zlz_qx4_1: string;
  zlz_qx4_4: string;
  zlz_qx4_5: string;
  zlz_qx5_1: string;
  zlz_qx5_5: string;
  zlz_qx5_6: string;
  zlz_qx6_1: string;
  zlz_qx6_6: string;
  zlz_qx6_7: string;
  zlz_qx7_1: string;
  zlz_qx7_7: string;
  zlz_qx7_8: string;
  zlz_qx8_1: string;
  zlz_qx8_8: string;
  zlz_qx8_9: string;
  zlz_qx9_1: string;
  zlz_qx9_9: string;
  zlz_qx9_10: string;
  zlz_qx10_1: string;
  zlz_qx10_10: string;
  zlz_qx10_11: string;
  zlz_qx11_1: string;
  zlz_qx11_11: string;
  ylz_zsj1: string;
  ylz_zsj2: string;
  ylz_zsj3: string;
  ylz_zsj4: string;
  ylz_zsj5: string;
  ylz_zsj6: string;
  ylz_zsj7: string;
  ylz_zsj8: string;
  ylz_zsj9: string;
  ylz_zsj10: string;
  ylz_zsj11: string;
  ylz_jy1: string;
  ylz_jy2: string;
  ylz_jy3: string;
  ylz_jy4: string;
  ylz_jy5: string;
  ylz_jy6: string;
  ylz_jy7: string;
  ylz_jy8: string;
  ylz_jy9: string;
  ylz_jy10: string;
  ylz_jy11: string;
  ylz_ts1: string;
  ylz_ts2: string;
  ylz_ts3: string;
  ylz_ts4: string;
  ylz_ts5: string;
  ylz_ts6: string;
  ylz_ts7: string;
  ylz_ts8: string;
  ylz_ts9: string;
  ylz_ts10: string;
  ylz_ts11: string;
  ylz_qx1_1: string;
  ylz_qx1_2: string;
  ylz_qx2_1: string;
  ylz_qx2_2: string;
  ylz_qx2_3: string;
  ylz_qx3_1: string;
  ylz_qx3_3: string;
  ylz_qx3_4: string;
  ylz_qx4_1: string;
  ylz_qx4_4: string;
  ylz_qx4_5: string;
  ylz_qx5_1: string;
  ylz_qx5_5: string;
  ylz_qx5_6: string;
  ylz_qx6_1: string;
  ylz_qx6_6: string;
  ylz_qx6_7: string;
  ylz_qx7_1: string;
  ylz_qx7_7: string;
  ylz_qx7_8: string;
  ylz_qx8_1: string;
  ylz_qx8_8: string;
  ylz_qx8_9: string;
  ylz_qx9_1: string;
  ylz_qx9_9: string;
  ylz_qx9_10: string;
  ylz_qx10_1: string;
  ylz_qx10_10: string;
  ylz_qx10_11: string;
  ylz_qx11_1: string;
  ylz_qx11_11: string;
  zzj_zsj: string;
  zzj_jy: string;
  zzj_ts: string;
  zzj_qx1: string;
  zzj_qx2: string;
  zzj_qx3: string;
  zct_zsj: string;
  zct_jy: string;
  zct_ts: string;
  zct_qx: string;
  yzj_zsj: string;
  yzj_jy: string;
  yzj_ts: string;
  yzj_qx1: string;
  yzj_qx2: string;
  yzj_qx3: string;
  yct_zsj: string;
  yct_jy: string;
  yct_ts: string;
  yct_qx: string;
  czz: string;
  gz: string;
  wxg: string;
  zjy: string;
  ysy: string;
  bz: string;
}

interface CHR502InputParams {
  sbbh: string;
  sbmc: string;
  dwmc: string;
  zzsj: string;
  zzdw: string;
  scjsj: string;
  jyrq: string;
  zjgb: string;
  zjgb_1: string;
  zjgb_2: string;
  zjgb_3: string;
  zjgb_4: string;
  zjgb_5: string;
  zjgb_6: string;
  zjgb_7: string;
  zjgb_8: string;
  zjgb_9: string;
  zjgb_10: string;
  zjgb_11: string;
  zjgb_12: string;
  zjgb_13: string;
  zjgb_14: string;
  zjgb_15: string;
  zjgb_16: string;
  zjgb_17: string;
  zjgb_18: string;
  zjgb_19: string;
  zjgb_20: string;
  zjgb_21: string;
  zjgb_22: string;
  zjgb_23: string;
  zjgb_24: string;
  zjgb_25: string;
  zjgb_26: string;
  zjgb_27: string;
  zjgb_28: string;
  zjgb_29: string;
  zjgb_30: string;
  zjgb_31: string;
  zjgb_32: string;
  zjgb_33: string;
  zjgb_34: string;
  zjgb_35: string;
  zjgb_36: string;
  zjgb_37: string;
  zjgb_38: string;
  zjgb_39: string;
  zjgb_40: string;
  zjgb_41: string;
  zjgb_42: string;
  zjgb_43: string;
  zjgb_44: string;
  zjgb_45: string;
  zjgb_46: string;
  zjgb_47: string;
  zjgb_48: string;
  zjgb_49: string;
  zjgb_50: string;
  zjgb_51: string;
  zjgb_52: string;
  zjgb_53: string;
  zjgb_54: string;
  zjgb_55: string;
  zjgb_56: string;
  zjgb_57: string;
  zjgb_58: string;
  zjgb_59: string;
  zjgb_60: string;
  zjgb_61: string;
  zjgb_62: string;
  zjgb_63: string;
  zjgb_64: string;
  zjgb_65: string;
  zjgb_66: string;
  zjgb_67: string;
  zjgb_68: string;
  zjgb_69: string;
  zjgb_70: string;
  zjgb_71: string;
  zjgb_72: string;
  zjgb_73: string;
  zjgb_74: string;
  zjgb_75: string;
  zjgb_76: string;
  zjgb_77: string;
  zjgb_78: string;
  zjgb_79: string;
  zjgb_80: string;
  zjgb_81: string;
  zjgb_82: string;
  zjgb_83: string;
  zjgb_84: string;
  zjgb_85: string;
  zjgb_86: string;
  zjgb_87: string;
  zjgb_88: string;
  zjgb_89: string;
  zjgb_90: string;
  zjgb_91: string;
  zjgb_92: string;
  zjgb_93: string;
  zjgb_94: string;
  zjgb_95: string;
  zjgb_96: string;
  zjgb_97: string;
  zjgb_98: string;
  zjgb_99: string;
  zjgb_100: string;
  zjgb_101: string;
  zjgb_102: string;
  zjgb_103: string;
  zjgb_104: string;
  zjgb_105: string;
  zjgb_106: string;
  zjgb_107: string;
  zjgb_108: string;
  zjgb_109: string;
  zjgb_110: string;
  zjgb_111: string;
  zjgb_112: string;
  zjgb_113: string;
  zjgb_114: string;
  zjgb_115: string;
  zjgb_116: string;
  zjgb_117: string;
  zjgb_118: string;
  zjgb_119: string;
  zjgb_120: string;
  zjgb_121: string;
  zjgb_122: string;
  zjgb_123: string;
  zjgb_124: string;
  zjgb_125: string;
  zjgb_126: string;
  zjgb_127: string;
  zjgb_128: string;
  zjgb_129: string;
  zjgb_130: string;
  zjgb_131: string;
  zjgb_132: string;
  zjgb_133: string;
  zjgb_134: string;
  zjgb_135: string;
  zjgb_136: string;
  zjgb_137: string;
  zjgb_138: string;
  zjgb_139: string;
  zjgb_140: string;
  zjgb_141: string;
  zjgb_142: string;
  zjgb_143: string;
  zjgb_144: string;
  zjgb_145: string;
  zjgb_146: string;
  zjgb_147: string;
  zjgb_148: string;
  zjgb_149: string;
  zjgb_150: string;
  zjgb_151: string;
  zjgb_152: string;
  zjgb_153: string;
  zjgb_154: string;
  zjgb_155: string;
  zjgb_156: string;
  zjgb_157: string;
  zjgb_158: string;
  zjgb_159: string;
  zjgb_160: string;
  zjgb_161: string;
  zjgb_162: string;
  zjgb_163: string;
  zjgb_164: string;
  zjgb_165: string;
  zjgb_166: string;
  zjgb_167: string;
  zjgb_168: string;
  zjgb_169: string;
  zjgb_170: string;
  zjgb_171: string;
  zjgb_172: string;
  zjgb_173: string;
  zjgb_174: string;
  zjgb_175: string;
  zjgb_176: string;
  zjgb_177: string;
  zjgb_178: string;
  zjgb_179: string;
  zjgb_180: string;
  zjgb_181: string;
  zjgb_182: string;
  zjgb_183: string;
  zjgb_184: string;
  zjgb_185: string;
  zjgb_186: string;
  zjgb_187: string;
  zjgb_188: string;
  zjgb_189: string;
  zjgb_190: string;
  zjgb_191: string;
  zjgb_192: string;
  zjgb_193: string;
  zjgb_194: string;
  zjgb_195: string;
  zjgb_196: string;
  zjgb_197: string;
  zjgb_198: string;
  zjgb_199: string;
  zjgb_200: string;
  zjgb_201: string;
  zjgb_202: string;
  zjgb_203: string;
  zjgb_204: string;
  zjgb_205: string;
  tsg: string;
  gz: string;
  zjy: string;
  ysy: string;
  wxg: string;
  sbzz: string;
  tszz: string;
  zgld: string;
  bz: string;
}

interface CHR503InputParams {
  sbbh: string;
  sbmc: string;
  ggxh: string;
  zzcj: string;
  dwmc: string;
  jyrq: string;
  cl11: string;
  cl12: string;
  cl13: string;
  cl14: string;
  jg1: string;
  cl21: string;
  cl22: string;
  cl23: string;
  cl24: string;
  jg2: string;
  cl31: string;
  cl32: string;
  cl33: string;
  cl34: string;
  jg3: string;
  cl41: string;
  cl42: string;
  cl43: string;
  cl44: string;
  jg4: string;
  cl51: string;
  cl52: string;
  cl53: string;
  cl54: string;
  jg5: string;
  cl61: string;
  cl62: string;
  cl63: string;
  cl64: string;
  jg6: string;
  cl71: string;
  cl72: string;
  cl73: string;
  cl74: string;
  jg7: string;
  cl81: string;
  cl82: string;
  cl83: string;
  cl84: string;
  jg8: string;
  cl91: string;
  cl92: string;
  cl93: string;
  cl94: string;
  jg9: string;
  cl101: string;
  cl102: string;
  cl103: string;
  cl104: string;
  jg10: string;
  tsg: string;
  gz: string;
  zjy: string;
  ysy: string;
  wxg: string;
  sbzz: string;
  tszz: string;
  zgld: string;
  bz: string;
}

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

const emit = createEmit("api_set");

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
}

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

    const [result] = await this.db
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
      throw new Error(`未找到验证记录[${id}]`);
    }

    const chr501Params: CHR501InputParams =
      await this.verifyToCHR501InputParams(record);

    return this.sendCHR501ToServer(chr501Params);
  }
  handleUploadCHR502(id: string) {}
  handleUploadCHR503(id: string) {}

  async verifyToCHR501InputParams(
    record: VerifyWithData,
  ): Promise<CHR501InputParams> {
    const corporation = await this.mdb.getCorporation();
    const data = await this.resolveFlawData(record);

    const leftLzData = data.filter(({ flaw }) => {
      return isLeftFlaw(flaw.nBoard) && isLZFlaw(flaw.nChannel);
    });

    const leftXHCData = data.filter(({ flaw }) => {
      return isLeftFlaw(flaw.nBoard) && isXHCFlaw(flaw.nChannel);
    });

    const leftCTData = data.filter(({ flaw }) => {
      return isLeftFlaw(flaw.nBoard) && isCTFlaw(flaw.nChannel);
    });

    const rightLzData = data.filter(({ flaw }) => {
      return isRightFlaw(flaw.nBoard) && isLZFlaw(flaw.nChannel);
    });

    const rightXHCData = data.filter(({ flaw }) => {
      return isRightFlaw(flaw.nBoard) && isXHCFlaw(flaw.nChannel);
    });

    const rightCTData = data.filter(({ flaw }) => {
      return isRightFlaw(flaw.nBoard) && isCTFlaw(flaw.nChannel);
    });

    return {
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      ggxh: corporation.DeviceType || "",
      zzcj: "武铁紫云轨道装备有限公司",
      dwmc: corporation.Factory || "",
      jyrq: dayjs(record.tmNow).format("YYYY-MM-DD"),
      swmkxh: record.szWHModel || "",
      zlz_zsj1: leftLzData[0]?.zsj || "",
      zlz_zsj2: leftLzData[1]?.zsj || "",
      zlz_zsj3: leftLzData[2]?.zsj || "",
      zlz_zsj4: leftLzData[3]?.zsj || "",
      zlz_zsj5: leftLzData[4]?.zsj || "",
      zlz_zsj6: leftLzData[5]?.zsj || "",
      zlz_zsj7: leftLzData[6]?.zsj || "",
      zlz_zsj8: leftLzData[7]?.zsj || "",
      zlz_zsj9: leftLzData[8]?.zsj || "",
      zlz_zsj10: leftLzData[9]?.zsj || "",
      zlz_zsj11: leftLzData[10]?.zsj || "",
      zlz_jy1: leftLzData[0]?.jy || "",
      zlz_jy2: leftLzData[1]?.jy || "",
      zlz_jy3: leftLzData[2]?.jy || "",
      zlz_jy4: leftLzData[3]?.jy || "",
      zlz_jy5: leftLzData[4]?.jy || "",
      zlz_jy6: leftLzData[5]?.jy || "",
      zlz_jy7: leftLzData[6]?.jy || "",
      zlz_jy8: leftLzData[7]?.jy || "",
      zlz_jy9: leftLzData[8]?.jy || "",
      zlz_jy10: leftLzData[9]?.jy || "",
      zlz_jy11: leftLzData[10]?.jy || "",
      zlz_ts1: leftLzData[0]?.ts || "",
      zlz_ts2: leftLzData[1]?.ts || "",
      zlz_ts3: leftLzData[2]?.ts || "",
      zlz_ts4: leftLzData[3]?.ts || "",
      zlz_ts5: leftLzData[4]?.ts || "",
      zlz_ts6: leftLzData[5]?.ts || "",
      zlz_ts7: leftLzData[6]?.ts || "",
      zlz_ts8: leftLzData[7]?.ts || "",
      zlz_ts9: leftLzData[8]?.ts || "",
      zlz_ts10: leftLzData[9]?.ts || "",
      zlz_ts11: leftLzData[10]?.ts || "",
      zlz_qx1_1: "",
      zlz_qx1_2: "",
      zlz_qx2_1: "",
      zlz_qx2_2: "",
      zlz_qx2_3: "",
      zlz_qx3_1: "",
      zlz_qx3_3: "",
      zlz_qx3_4: "9.7",
      zlz_qx4_1: "4",
      zlz_qx4_4: "5",
      zlz_qx4_5: "3",
      zlz_qx5_1: "1",
      zlz_qx5_5: "2.5",
      zlz_qx5_6: "2",
      zlz_qx6_1: "3",
      zlz_qx6_6: "3",
      zlz_qx6_7: "2",
      zlz_qx7_1: "2.4",
      zlz_qx7_7: "1.2",
      zlz_qx7_8: "9.7",
      zlz_qx8_1: "4",
      zlz_qx8_8: "5",
      zlz_qx8_9: "3",
      zlz_qx9_1: "1",
      zlz_qx9_9: "2.5",
      zlz_qx9_10: "2",
      zlz_qx10_1: "3",
      zlz_qx10_10: "3",
      zlz_qx10_11: "2",
      zlz_qx11_1: "2.4",
      zlz_qx11_11: "1.2",
      ylz_zsj1: rightLzData[0]?.zsj || "",
      ylz_zsj2: rightLzData[1]?.zsj || "",
      ylz_zsj3: rightLzData[2]?.zsj || "",
      ylz_zsj4: rightLzData[3]?.zsj || "",
      ylz_zsj5: rightLzData[4]?.zsj || "",
      ylz_zsj6: rightLzData[5]?.zsj || "",
      ylz_zsj7: rightLzData[6]?.zsj || "",
      ylz_zsj8: rightLzData[7]?.zsj || "",
      ylz_zsj9: rightLzData[8]?.zsj || "",
      ylz_zsj10: rightLzData[9]?.zsj || "",
      ylz_zsj11: rightLzData[10]?.zsj || "",
      ylz_jy1: rightLzData[0]?.jy || "",
      ylz_jy2: rightLzData[1]?.jy || "",
      ylz_jy3: rightLzData[2]?.jy || "",
      ylz_jy4: rightLzData[3]?.jy || "",
      ylz_jy5: rightLzData[4]?.jy || "",
      ylz_jy6: rightLzData[5]?.jy || "",
      ylz_jy7: rightLzData[6]?.jy || "",
      ylz_jy8: rightLzData[7]?.jy || "",
      ylz_jy9: rightLzData[8]?.jy || "",
      ylz_jy10: rightLzData[9]?.jy || "",
      ylz_jy11: rightLzData[10]?.jy || "",
      ylz_ts1: rightLzData[0]?.ts || "",
      ylz_ts2: rightLzData[1]?.ts || "",
      ylz_ts3: rightLzData[2]?.ts || "",
      ylz_ts4: rightLzData[3]?.ts || "",
      ylz_ts5: rightLzData[4]?.ts || "",
      ylz_ts6: rightLzData[5]?.ts || "",
      ylz_ts7: rightLzData[6]?.ts || "",
      ylz_ts8: rightLzData[7]?.ts || "",
      ylz_ts9: rightLzData[8]?.ts || "",
      ylz_ts10: rightLzData[9]?.ts || "",
      ylz_ts11: rightLzData[10]?.ts || "",
      ylz_qx1_1: "2",
      ylz_qx1_2: "2.4",
      ylz_qx2_1: "1.2",
      ylz_qx2_2: "9.7",
      ylz_qx2_3: "4",
      ylz_qx3_1: "5",
      ylz_qx3_3: "3",
      ylz_qx3_4: "1",
      ylz_qx4_1: "2.5",
      ylz_qx4_4: "2",
      ylz_qx4_5: "3",
      ylz_qx5_1: "3",
      ylz_qx5_5: "2",
      ylz_qx5_6: "2.4",
      ylz_qx6_1: "1.2",
      ylz_qx6_6: "9.7",
      ylz_qx6_7: "4",
      ylz_qx7_1: "5",
      ylz_qx7_7: "3",
      ylz_qx7_8: "1",
      ylz_qx8_1: "2.5",
      ylz_qx8_8: "2",
      ylz_qx8_9: "3",
      ylz_qx9_1: "3",
      ylz_qx9_9: "2",
      ylz_qx9_10: "2.4",
      ylz_qx10_1: "1.2",
      ylz_qx10_10: "9.7",
      ylz_qx10_11: "4",
      ylz_qx11_1: "5",
      ylz_qx11_11: "3",
      zzj_zsj: leftXHCData[0].zsj,
      zzj_jy: leftXHCData[0].jy,
      zzj_ts: leftXHCData[0].ts,
      zzj_qx1: leftXHCData[0].flaw.fltValueX.toString(),
      zzj_qx2: leftXHCData[1].flaw.fltValueX.toString(),
      zzj_qx3: leftXHCData[2].flaw.fltValueX.toString(),
      zct_zsj: leftCTData[0].zsj,
      zct_jy: leftCTData[0].jy,
      zct_ts: leftCTData[0].ts,
      zct_qx: leftCTData[0].flaw.fltValueX.toString(),
      yzj_zsj: rightXHCData[0].zsj,
      yzj_jy: rightXHCData[0].jy,
      yzj_ts: rightXHCData[0].ts,
      yzj_qx1: rightXHCData[0].flaw.fltValueX.toString(),
      yzj_qx2: rightXHCData[1].flaw.fltValueX.toString(),
      yzj_qx3: rightXHCData[2].flaw.fltValueX.toString(),
      yct_zsj: rightCTData[0].zsj,
      yct_jy: rightCTData[0].jy,
      yct_ts: rightCTData[0].ts,
      yct_qx: rightCTData[0].flaw.fltValueX.toString(),
      czz: record.szUsername || "",
      gz: "李四",
      wxg: "刘飞",
      zjy: "王五",
      ysy: "赵六",
      bz: "备注",
    };
  }

  resolveFlawData(record: VerifyWithData) {
    return Promise.all(
      record.with.map(async (flaw) => {
        const detector = await this.mdb.getDetector(
          flaw.nChannel,
          flaw.nBoard,
          record.szWHModel || "",
        );

        return {
          flaw,
          detector,
          zsj: calculateZSJ(detector.nWAngle),
          jy: calculateJY(flaw.nAtten),
          ts: calculateTS(flaw.nAtten, detector.nDBSub),
        };
      }),
    );
  }
}

export const bindIpcHandlers = (hmis: KH, ipcHandle: IpcHandle) => {
  (ipcHandle("HMIS/kh_hmis_sqlite_get", (_, params) =>
    hmis.handleReadRecord(params),
  ),
    ipcHandle("HMIS/kh_hmis_sqlite_delete", (_, id) =>
      hmis.handleDeleteRecord(id),
    ));
  ipcHandle("HMIS/kh_hmis_sqlite_insert", (_, params) =>
    hmis.handleInsertRecord(params),
  );
  ipcHandle("HMIS/kh_hmis_api_get", (_, barcode) => hmis.handleFetch(barcode));
  ipcHandle("HMIS/kh_hmis_api_set", (_, id) => hmis.handleUpload(id));
};
