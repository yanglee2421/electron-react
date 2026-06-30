// 康华 安康
import * as schema from "#main/features/db/schema";
import type { Logger } from "#main/features/logger";
import { createEmit } from "#main/lib";
import { resolveCHR503 } from "#shared/functions/chr503";
import {
  calcFlawType,
  calcNote,
  resolveMemoInfo,
} from "#shared/functions/chr52a";
import { divideBy10, mathFormat } from "#shared/functions/math";
import { KH_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import type { KH_HMIS } from "#shared/instances/schema";
import { kh_hmis } from "#shared/instances/schema";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import { is } from "@electron-toolkit/utils";
import { atFirstOrThrow, mapGroupBy } from "@yotulee/run";
import { Client } from "basic-ftp";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import { net } from "electron";
import pLimit from "p-limit";
import type { Subscription } from "rxjs";
import { BehaviorSubject } from "rxjs";
import type { DBClient } from "../db/types";
import type { MDB } from "../mdb";
import type { AppCradle } from "../types";
import type { I501Record } from "./501";
import type { I502Record } from "./502";
import type { I503 } from "./503";
import type { I52a } from "./52a";
import type {
  KHGetResponse,
  PostRequestItem,
  PostResponse,
  QXDataParams,
} from "./types";

const emit = createEmit("api_set");

export class KH {
  readonly state$: BehaviorSubject<KH_HMIS>;
  private db: DBClient;
  private mdb: MDB;
  private logger: Logger;
  private subscription: Subscription;

  constructor({ db, mdb, logger, kv }: AppCradle) {
    this.db = db.client;
    this.mdb = mdb;
    this.logger = logger;

    const stateJSON = kv.getItem(KH_HMIS_STORAGE_KEY);
    const data = stateJSON ? JSON.parse(stateJSON).state : {};
    const state = kh_hmis.parse(data);
    this.state$ = new BehaviorSubject(state);

    this.subscription = kv.events$.subscribe((e) => {
      if (e.key !== KH_HMIS_STORAGE_KEY) {
        return;
      }

      switch (e.action) {
        case "set":
          const stateJSON = e.value;
          const data = stateJSON ? JSON.parse(stateJSON).state : {};
          const state = kh_hmis.parse(data);
          this.state$.next(state);
          break;
        case "remove":
        case "clear":
          this.state$.next(kh_hmis.parse({}));
          break;
      }
    });
  }

  dispose() {
    this.state$.complete();
    this.subscription.unsubscribe();
  }

  get state() {
    return this.state$.getValue();
  }

  async autoUploadLoop() {
    if (!this.state.autoUpload) {
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
      const store = this.state;
      const delay = store.autoUploadInterval * 1000;

      setTimeout(this.autoUploadLoop.bind(this), delay);
    }
  }

  async sendQxToServer(params: QXDataParams) {
    const store = this.state;
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/lzdx_csbtsj_whzy_tsjgqx/save`);
    const body = JSON.stringify(params);

    this.logger.log({
      title: `请求数据[${url.href}]:`,
      json: body,
    });

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
    this.logger.log({
      title: `返回数据[${url.href}]:`,
      json: JSON.stringify(data),
    });

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

    const store = this.state;
    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();
    const corporation = await this.mdb.app().corporation();
    const detections = await this.mdb
      .root()
      .detections()
      .equal("szIDsMake", record.zh)
      .date("tmnow", new Date(startDate), new Date(endDate));
    const detection = atFirstOrThrow(
      detections.rows,
      () => new Error(`未找到记录#${id}对应的检测数据`),
    );
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
    const store = this.state;
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/lzdx_csbtsj_tsjg/save`);
    const body = JSON.stringify(params);

    this.logger.log({
      title: `请求数据:`,
      message: url.href,
      json: body,
    });

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
    this.logger.log({
      title: `返回数据:`,
      message: url.href,
      json: JSON.stringify(data),
    });

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR501ToServer(params: I501Record) {
    const store = this.state;
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/csbts_501/save`);
    const body = JSON.stringify(params);

    this.logger.log({
      title: `请求数据:`,
      message: url.href,
      json: body,
    });

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
    this.logger.log({
      title: `返回数据:`,
      message: url.href,
      json: JSON.stringify(data),
    });

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR502ToServer(params: I502Record) {
    const store = this.state;
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/csbts_502/save`);
    const body = JSON.stringify(params);

    this.logger.log({
      title: `请求数据:`,
      message: url.href,
      json: body,
    });

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
    this.logger.log({
      title: `返回数据:`,
      message: url.href,
      json: JSON.stringify(data),
    });

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR503ToServer(params: I503) {
    const store = this.state;
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/csbts_503/save`);
    const body = JSON.stringify(params);

    this.logger.log({
      title: `请求数据:`,
      message: url.href,
      json: body,
    });

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
    this.logger.log({
      title: `返回数据:`,
      message: url.href,
      json: JSON.stringify(data),
    });

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR52AToServer(params: I52a) {
    const store = this.state;
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/ct52a1_3/save`);
    const body = JSON.stringify(params);

    this.logger.log({
      title: `请求数据:`,
      message: url.href,
      json: body,
    });

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
    this.logger.log({
      title: `返回数据:`,
      message: url.href,
      json: JSON.stringify(data),
    });

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }

  async handleFetch(dh: string) {
    const store = this.state;
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/lzdx_csbtsj_get/get`);
    const body = JSON.stringify({ mesureId: dh });

    this.logger.log({
      title: `请求数据:`,
      message: url.href,
      json: body,
    });

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
    this.logger.log({
      title: `返回数据:`,
      message: url.href,
      json: JSON.stringify(data),
    });

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
    const chr501Params = await this.resolveCHR501InputParams(id);

    return this.sendCHR501ToServer(chr501Params);
  }
  async handleUploadCHR502(ids: string[]) {
    const records = await this.mdb.getDataForCHR502({ ids });

    if (records.rows.length < 5) {
      throw new Error(
        `CHR502接口至少需要5条记录，当前仅${records.rows.length}条`,
      );
    }

    const chr502Params = await this.resolveCHR502InputParams(ids);

    return this.sendCHR502ToServer(chr502Params);
  }
  async handleUploadCHR503(id: string) {
    const chr503Params = await this.resolveCHR503InputParams(id);

    return this.sendCHR503ToServer(chr503Params);
  }
  async handleUploadCHR52A(id: string) {
    const chr503Params = await this.resolveCHR52AInputParams(id);

    return this.sendCHR52AToServer(chr503Params);
  }

  async resolveCHR501InputParams(id: string): Promise<I501Record> {
    return {};
  }
  async resolveCHR502InputParams(ids: string[]): Promise<I502Record> {
    return {};
  }
  async resolveCHR503InputParams(id: string): Promise<I503> {
    const { rows } = await this.mdb.root().Quartor().equal("szIDs", id);
    const firstRecord = rows.at(0);

    if (!firstRecord) {
      throw new Error(`未能找到#${id}对应的记录`);
    }

    const corporation = await this.mdb.app().corporation();
    const rowsFor503 = resolveCHR503(rows, false);

    return {
      xrsj: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      ggxh: corporation.DeviceType || "",
      zzcj: "紫云公司",
      dwmc: corporation.Factory || "",
      jyrq: dayjs(firstRecord.tmNow).format("YYYY-MM-DD HH:mm:ss"),
      cl11: rowsFor503.rows.at(0)?.horValue || "",
      cl12: rowsFor503.rows.at(0)?.decValue || "",
      cl13: rowsFor503.rows.at(0)?.verValue || "",
      cl14: rowsFor503.rows.at(0)?.attValue || "",
      jg11: rowsFor503.rows.at(0)?.horResult ? "合格" : "不合格",
      jg12: rowsFor503.rows.at(0)?.decResult ? "合格" : "不合格",
      jg13: rowsFor503.rows.at(0)?.verResult ? "合格" : "不合格",
      jg14: rowsFor503.rows.at(0)?.attResult ? "合格" : "不合格",
      jg15: rowsFor503.rows.at(0)?.finallyResult ? "合格" : "不合格",

      cl21: rowsFor503.rows.at(1)?.horValue || "",
      cl22: rowsFor503.rows.at(1)?.decValue || "",
      cl23: rowsFor503.rows.at(1)?.verValue || "",
      cl24: rowsFor503.rows.at(1)?.attValue || "",
      jg21: rowsFor503.rows.at(1)?.horResult ? "合格" : "不合格",
      jg22: rowsFor503.rows.at(1)?.decResult ? "合格" : "不合格",
      jg23: rowsFor503.rows.at(1)?.verResult ? "合格" : "不合格",
      jg24: rowsFor503.rows.at(1)?.attResult ? "合格" : "不合格",
      jg25: rowsFor503.rows.at(1)?.finallyResult ? "合格" : "不合格",

      cl31: rowsFor503.rows.at(2)?.horValue || "",
      cl32: rowsFor503.rows.at(2)?.decValue || "",
      cl33: rowsFor503.rows.at(2)?.verValue || "",
      cl34: rowsFor503.rows.at(2)?.attValue || "",
      jg31: rowsFor503.rows.at(2)?.horResult ? "合格" : "不合格",
      jg32: rowsFor503.rows.at(2)?.decResult ? "合格" : "不合格",
      jg33: rowsFor503.rows.at(2)?.verResult ? "合格" : "不合格",
      jg34: rowsFor503.rows.at(2)?.attResult ? "合格" : "不合格",
      jg35: rowsFor503.rows.at(2)?.finallyResult ? "合格" : "不合格",

      cl41: rowsFor503.rows.at(3)?.horValue || "",
      cl42: rowsFor503.rows.at(3)?.decValue || "",
      cl43: rowsFor503.rows.at(3)?.verValue || "",
      cl44: rowsFor503.rows.at(3)?.attValue || "",
      jg41: rowsFor503.rows.at(3)?.horResult ? "合格" : "不合格",
      jg42: rowsFor503.rows.at(3)?.decResult ? "合格" : "不合格",
      jg43: rowsFor503.rows.at(3)?.verResult ? "合格" : "不合格",
      jg44: rowsFor503.rows.at(3)?.attResult ? "合格" : "不合格",
      jg45: rowsFor503.rows.at(3)?.finallyResult ? "合格" : "不合格",

      cl51: rowsFor503.rows.at(4)?.horValue || "",
      cl52: rowsFor503.rows.at(4)?.decValue || "",
      cl53: rowsFor503.rows.at(4)?.verValue || "",
      cl54: rowsFor503.rows.at(4)?.attValue || "",
      jg51: rowsFor503.rows.at(4)?.horResult ? "合格" : "不合格",
      jg52: rowsFor503.rows.at(4)?.decResult ? "合格" : "不合格",
      jg53: rowsFor503.rows.at(4)?.verResult ? "合格" : "不合格",
      jg54: rowsFor503.rows.at(4)?.attResult ? "合格" : "不合格",
      jg55: rowsFor503.rows.at(4)?.finallyResult ? "合格" : "不合格",

      cl61: rowsFor503.rows.at(5)?.horValue || "",
      cl62: rowsFor503.rows.at(5)?.decValue || "",
      cl63: rowsFor503.rows.at(5)?.verValue || "",
      cl64: rowsFor503.rows.at(5)?.attValue || "",
      jg61: rowsFor503.rows.at(5)?.horResult ? "合格" : "不合格",
      jg62: rowsFor503.rows.at(5)?.decResult ? "合格" : "不合格",
      jg63: rowsFor503.rows.at(5)?.verResult ? "合格" : "不合格",
      jg64: rowsFor503.rows.at(5)?.attResult ? "合格" : "不合格",
      jg65: rowsFor503.rows.at(5)?.finallyResult ? "合格" : "不合格",

      cl71: rowsFor503.rows.at(6)?.horValue || "",
      cl72: rowsFor503.rows.at(6)?.decValue || "",
      cl73: rowsFor503.rows.at(6)?.verValue || "",
      cl74: rowsFor503.rows.at(6)?.attValue || "",
      jg71: rowsFor503.rows.at(6)?.horResult ? "合格" : "不合格",
      jg72: rowsFor503.rows.at(6)?.decResult ? "合格" : "不合格",
      jg73: rowsFor503.rows.at(6)?.verResult ? "合格" : "不合格",
      jg74: rowsFor503.rows.at(6)?.attResult ? "合格" : "不合格",
      jg75: rowsFor503.rows.at(6)?.finallyResult ? "合格" : "不合格",

      cl81: rowsFor503.rows.at(7)?.horValue || "",
      cl82: rowsFor503.rows.at(7)?.decValue || "",
      cl83: rowsFor503.rows.at(7)?.verValue || "",
      cl84: rowsFor503.rows.at(7)?.attValue || "",
      jg81: rowsFor503.rows.at(7)?.horResult ? "合格" : "不合格",
      jg82: rowsFor503.rows.at(7)?.decResult ? "合格" : "不合格",
      jg83: rowsFor503.rows.at(7)?.verResult ? "合格" : "不合格",
      jg84: rowsFor503.rows.at(7)?.attResult ? "合格" : "不合格",
      jg85: rowsFor503.rows.at(7)?.finallyResult ? "合格" : "不合格",

      cl91: rowsFor503.rows.at(8)?.horValue || "",
      cl92: rowsFor503.rows.at(8)?.decValue || "",
      cl93: rowsFor503.rows.at(8)?.verValue || "",
      cl94: rowsFor503.rows.at(8)?.attValue || "",
      jg91: rowsFor503.rows.at(8)?.horResult ? "合格" : "不合格",
      jg92: rowsFor503.rows.at(8)?.decResult ? "合格" : "不合格",
      jg93: rowsFor503.rows.at(8)?.verResult ? "合格" : "不合格",
      jg94: rowsFor503.rows.at(8)?.attResult ? "合格" : "不合格",
      jg95: rowsFor503.rows.at(8)?.finallyResult ? "合格" : "不合格",

      cl101: rowsFor503.rows.at(9)?.horValue || "",
      cl102: rowsFor503.rows.at(9)?.decValue || "",
      cl103: rowsFor503.rows.at(9)?.verValue || "",
      cl104: rowsFor503.rows.at(9)?.attValue || "",
      jg101: rowsFor503.rows.at(9)?.horResult ? "合格" : "不合格",
      jg102: rowsFor503.rows.at(9)?.decResult ? "合格" : "不合格",
      jg103: rowsFor503.rows.at(9)?.verResult ? "合格" : "不合格",
      jg104: rowsFor503.rows.at(9)?.attResult ? "合格" : "不合格",
      jg105: rowsFor503.rows.at(9)?.finallyResult ? "合格" : "不合格",

      cl111: rowsFor503.rows.at(10)?.horValue || "",
      cl112: rowsFor503.rows.at(10)?.decValue || "",
      cl113: rowsFor503.rows.at(10)?.verValue || "",
      cl114: rowsFor503.rows.at(10)?.attValue || "",
      jg111: rowsFor503.rows.at(10)?.horResult ? "合格" : "不合格",
      jg112: rowsFor503.rows.at(10)?.decResult ? "合格" : "不合格",
      jg113: rowsFor503.rows.at(10)?.verResult ? "合格" : "不合格",
      jg114: rowsFor503.rows.at(10)?.attResult ? "合格" : "不合格",
      jg115: rowsFor503.rows.at(10)?.finallyResult ? "合格" : "不合格",

      cl121: rowsFor503.rows.at(11)?.horValue || "",
      cl122: rowsFor503.rows.at(11)?.decValue || "",
      cl123: rowsFor503.rows.at(11)?.verValue || "",
      cl124: rowsFor503.rows.at(11)?.attValue || "",
      jg121: rowsFor503.rows.at(11)?.horResult ? "合格" : "不合格",
      jg122: rowsFor503.rows.at(11)?.decResult ? "合格" : "不合格",
      jg123: rowsFor503.rows.at(11)?.verResult ? "合格" : "不合格",
      jg124: rowsFor503.rows.at(11)?.attResult ? "合格" : "不合格",
      jg125: rowsFor503.rows.at(11)?.finallyResult ? "合格" : "不合格",

      cl131: "",
      cl132: "",
      cl133: "",
      cl134: "",
      jg131: "",
      jg132: "",
      jg133: "",
      jg134: "",
      jg135: "",

      cl141: "",
      cl142: "",
      cl143: "",
      cl144: "",
      jg141: "",
      jg142: "",
      jg143: "",
      jg144: "",
      jg145: "",

      cl151: "",
      cl152: "",
      cl153: "",
      cl154: "",
      jg151: "",
      jg152: "",
      jg153: "",
      jg154: "",
      jg155: "",

      cl161: "",
      cl162: "",
      cl163: "",
      cl164: "",
      jg161: "",
      jg162: "",
      jg163: "",
      jg164: "",
      jg165: "",

      cl171: "",
      cl172: "",
      cl173: "",
      cl174: "",
      jg171: "",
      jg172: "",
      jg173: "",
      jg174: "",
      jg175: "",

      cl181: "",
      cl182: "",
      cl183: "",
      cl184: "",
      jg181: "",
      jg182: "",
      jg183: "",
      jg184: "",
      jg185: "",

      cl191: "",
      cl192: "",
      cl193: "",
      cl194: "",
      jg191: "",
      jg192: "",
      jg193: "",
      jg194: "",
      jg195: "",

      cl201: "",
      cl202: "",
      cl203: "",
      cl204: "",
      jg201: "",
      jg202: "",
      jg203: "",
      jg204: "",
      jg205: "",

      cl211: "",
      cl212: "",
      cl213: "",
      cl214: "",
      jg211: "",
      jg212: "",
      jg213: "",
      jg214: "",
      jg215: "",

      cl221: "",
      cl222: "",
      cl223: "",
      cl224: "",
      jg221: "",
      jg222: "",
      jg223: "",
      jg224: "",
      jg225: "",

      cl231: "",
      cl232: "",
      cl233: "",
      cl234: "",
      jg231: "",
      jg232: "",
      jg233: "",
      jg234: "",
      jg235: "",

      cl241: "",
      cl242: "",
      cl243: "",
      cl244: "",
      jg241: "",
      jg242: "",
      jg243: "",
      jg244: "",
      jg245: "",

      cl251: "",
      cl252: "",
      cl253: "",
      cl254: "",
      jg251: "",
      jg252: "",
      jg253: "",
      jg254: "",
      jg255: "",

      cl261: "",
      cl262: "",
      cl263: "",
      cl264: "",
      jg261: "",
      jg262: "",
      jg263: "",
      jg264: "",
      jg265: "",

      cl271: "",
      cl272: "",
      cl273: "",
      cl274: "",
      jg271: "",
      jg272: "",
      jg273: "",
      jg274: "",
      jg275: "",

      cl281: "",
      cl282: "",
      cl283: "",
      cl284: "",
      jg281: "",
      jg282: "",
      jg283: "",
      jg284: "",
      jg285: "",

      cl291: "",
      cl292: "",
      cl293: "",
      cl294: "",
      jg291: "",
      jg292: "",
      jg293: "",
      jg294: "",
      jg295: "",

      cl301: "",
      cl302: "",
      cl303: "",
      cl304: "",
      jg301: "",
      jg302: "",
      jg303: "",
      jg304: "",
      jg305: "",

      cl311: "",
      cl312: "",
      cl313: "",
      cl314: "",
      jg311: "",
      jg312: "",
      jg313: "",
      jg314: "",
      jg315: "",

      cl321: "",
      cl322: "",
      cl323: "",
      cl324: "",
      jg321: "",
      jg322: "",
      jg323: "",
      jg324: "",
      jg325: "",

      cl331: "",
      cl332: "",
      cl333: "",
      cl334: "",
      jg331: "",
      jg332: "",
      jg333: "",
      jg334: "",
      jg335: "",

      cl341: "",
      cl342: "",
      cl343: "",
      cl344: "",
      jg341: "",
      jg342: "",
      jg343: "",
      jg344: "",
      jg345: "",

      cl351: "",
      cl352: "",
      cl353: "",
      cl354: "",
      jg351: "",
      jg352: "",
      jg353: "",
      jg354: "",
      jg355: "",

      tsg: firstRecord.szUsername || "",
      gz: this.state.tsgz,
      zjy: this.state.tszjy,
      ysy: this.state.tsysy,
      wxg: this.state.tswxg,
      sbzz: this.state.sbzz,
      tszz: this.state.tszz,
      zgld: this.state.zgld,
      bz: "",
    };
  }
  async resolveCHR52AInputParams(id: string): Promise<I52a> {
    const { rows } = await this.mdb.root().detections().equal("szIDs", id);
    const firstRecord = rows.at(0);

    if (!firstRecord) {
      throw new Error(`未能找到#${id}对应的记录`);
    }

    const corporation = await this.mdb.app().corporation();
    const { rows: datas } = await this.mdb
      .root()
      .detections_data()
      .equal("opid", firstRecord.szIDs);
    const memoInfo = resolveMemoInfo(firstRecord.szMemo);
    const flawGroup = mapGroupBy(
      datas,
      (data) => `${data.nBoard}-${data.nChannel}`,
    );

    const renderFlawCount = (board: number, channel: number) => {
      return flawGroup.get(`${board}-${channel}`)?.length || "无";
    };

    const calcQxslwz = (board: number, channel: number) => {
      const typeNumber = memoInfo.get(`${board}-${channel}`);
      const flawType = calcFlawType(typeNumber);

      if (flawType !== "裂纹") {
        return "";
      }

      const flaws = flawGroup.get(`${board}-${channel}`) || [];
      const db = flaws?.at(0)?.nAtten || 0;

      return `${divideBy10(db)}dB;${flaws.map((flaw) => mathFormat(flaw.fltValueX, { precision: 0 })).join(" ")}`;
    };

    console.log(firstRecord.szIDs, firstRecord.szIDsWheel);

    const images = await this.upload52aImageByFtp(
      firstRecord.szIDs,
      firstRecord.szIDsWheel || "",
    );

    return {
      xrsj: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      dwmc: corporation.Factory || "",
      tssj: dayjs(firstRecord.tmNow).format("YYYY-MM-DD HH:mm:ss"),
      zx: firstRecord.szWHModel || "",
      zh: firstRecord.szIDsWheel || "",
      czzzrq: firstRecord.szTMMake || "",
      czzzdw: firstRecord.szIDsMake || "",
      ldsczzrq: firstRecord.szTMFirst || "",
      ldsczzdw: firstRecord.szIDsFirst || "",
      ldmczzrq: firstRecord.szTMLast || "",
      ldmczzdw: firstRecord.szIDsLast || "",

      ttbh1: `左穿透: ${renderFlawCount(0, 0)}`,
      qxslwz1: calcQxslwz(0, 0),
      qxlx1: calcFlawType(memoInfo.get("0-0")),

      ttbh2: `左A01: ${renderFlawCount(0, 1)}`,
      qxslwz2: calcQxslwz(0, 1),
      qxlx2: calcFlawType(memoInfo.get("0-1")),

      ttbh3: `左A02: ${renderFlawCount(0, 2)}`,
      qxslwz3: calcQxslwz(0, 2),
      qxlx3: calcFlawType(memoInfo.get("0-2")),

      ttbh4: `左轮座01: ${renderFlawCount(0, 3)}`,
      qxslwz4: calcQxslwz(0, 3),
      qxlx4: calcFlawType(memoInfo.get("0-3")),

      ttbh5: `左轮座02: ${renderFlawCount(0, 4)}`,
      qxslwz5: calcQxslwz(0, 4),
      qxlx5: calcFlawType(memoInfo.get("0-4")),

      ttbh6: "",
      qxslwz6: "",
      qxlx6: "",

      ttbh7: `右穿透: ${renderFlawCount(1, 0)}`,
      qxslwz7: calcQxslwz(1, 0),
      qxlx7: calcFlawType(memoInfo.get("1-0")),

      ttbh8: `右A01: ${renderFlawCount(1, 1)}`,
      qxslwz8: calcQxslwz(1, 1),
      qxlx8: calcFlawType(memoInfo.get("1-1")),

      ttbh9: `右A02: ${renderFlawCount(1, 2)}`,
      qxslwz9: calcQxslwz(1, 2),
      qxlx9: calcFlawType(memoInfo.get("1-2")),

      ttbh10: `右轮座01: ${renderFlawCount(1, 3)}`,
      qxslwz10: calcQxslwz(1, 3),
      qxlx10: calcFlawType(memoInfo.get("1-3")),

      ttbh11: `右轮座02: ${renderFlawCount(1, 4)}`,
      qxslwz11: calcQxslwz(1, 4),
      qxlx11: calcFlawType(memoInfo.get("1-4")),

      ttbh12: "",
      qxslwz12: "",
      qxlx12: "",

      ttbh13: "",
      qxslwz13: "",
      qxlx13: "",

      ttbh14: "",
      qxslwz14: "",
      qxlx14: "",

      ttbh15: "",
      qxslwz15: "",
      qxlx15: "",

      zzjsmt: images.lxhFtpPath,
      yzjsmt: images.rxhFtpPath,
      zlzsmt: images.llzFtpPath,
      ylzsmt: images.rlzFtpPath,
      zctsmt: images.lctFtpPath,
      yctsmt: images.rctFtpPath,

      clff: calcNote(datas, firstRecord.szMemo),
      tsg: firstRecord.szUsername || "",
      gz: this.state.tsgz,
      zjy: this.state.tszjy,
      ysy: this.state.tsysy,
    };
  }
  async upload501ImagesByFtp(id: string) {}
  async upload52aImageByFtp(id: string, zh: string) {
    const rootPath = await this.mdb.rootFolder();
    const lxhImage = this.mdb.dataImagePath(rootPath, `${id}.LXH.bmp`);
    const rxhImage = this.mdb.dataImagePath(rootPath, `${id}.RXH.bmp`);
    const llzImage = this.mdb.dataImagePath(rootPath, `${id}.LLZ.bmp`);
    const rlzImage = this.mdb.dataImagePath(rootPath, `${id}.RLZ.bmp`);
    const lctImage = this.mdb.dataImagePath(rootPath, `${id}.LCT.bmp`);
    const rctImage = this.mdb.dataImagePath(rootPath, `${id}.RCT.bmp`);
    const date = dayjs().format("YYYYMMDD");
    let lxhFtpPath = `/csbts/${date + zh}01.bmp`;
    let rxhFtpPath = `/csbts/${date + zh}02.bmp`;
    let llzFtpPath = `/csbts/${date + zh}03.bmp`;
    let rlzFtpPath = `/csbts/${date + zh}04.bmp`;
    let lctFtpPath = `/csbts/${date + zh}05.bmp`;
    let rctFtpPath = `/csbts/${date + zh}06.bmp`;

    const ftpClient = new Client();

    try {
      await ftpClient.access({
        host: this.state.ftpHost,
        port: this.state.ftpPort,
        user: this.state.ftpUser,
        password: this.state.ftpPassword,
      });

      await ftpClient.ensureDir("/csbts/");
      await ftpClient.uploadFrom(lxhImage, lxhFtpPath).catch(() => {
        lxhFtpPath = "";
      });
      await ftpClient.uploadFrom(rxhImage, rxhFtpPath).catch(() => {
        rxhFtpPath = "";
      });
      await ftpClient.uploadFrom(llzImage, llzFtpPath).catch(() => {
        llzFtpPath = "";
      });
      await ftpClient.uploadFrom(rlzImage, rlzFtpPath).catch(() => {
        rlzFtpPath = "";
      });
      await ftpClient.uploadFrom(lctImage, lctFtpPath).catch(() => {
        lctFtpPath = "";
      });
      await ftpClient.uploadFrom(rctImage, rctFtpPath).catch(() => {
        rctFtpPath = "";
      });
    } catch (error) {
      if (is.dev) {
        console.error(error);
      }

      throw error;
    } finally {
      ftpClient.close();
    }

    return {
      lxhFtpPath,
      rxhFtpPath,
      llzFtpPath,
      rlzFtpPath,
      lctFtpPath,
      rctFtpPath,
    };
  }
}
