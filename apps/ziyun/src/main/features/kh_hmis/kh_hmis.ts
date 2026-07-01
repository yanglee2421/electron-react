// 康华 安康
import * as schema from "#main/features/db/schema";
import type { Logger } from "#main/features/logger";
import type { QuartorData } from "#main/features/mdb/types";
import { createEmit } from "#main/lib";
import { calculateMaxDiff, calculateResult } from "#shared/functions/chr502";
import { resolveCHR503 } from "#shared/functions/chr503";
import {
  calcFlawType,
  calcNote,
  resolveMemoInfo,
} from "#shared/functions/chr52a";
import { calculateXHCFlaws } from "#shared/functions/flawDetection";
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
import path from "node:path";
import pLimit from "p-limit";
import type { Subscription } from "rxjs";
import { BehaviorSubject, distinctUntilChanged, tap } from "rxjs";
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
  private subscriptions: Subscription[];
  private timer: NodeJS.Timeout | number = 0;

  constructor({ db, mdb, logger, kv }: AppCradle) {
    this.db = db.client;
    this.mdb = mdb;
    this.logger = logger;

    const stateJSON = kv.getItem(KH_HMIS_STORAGE_KEY);
    const data = stateJSON ? JSON.parse(stateJSON).state : {};
    const state = kh_hmis.parse(data);
    this.state$ = new BehaviorSubject(state);

    const subscription1 = kv.events$
      .pipe(
        tap((e) => {
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
        }),
      )
      .subscribe();

    const subscription2 = this.state$
      .pipe(
        distinctUntilChanged(
          (prev, next) =>
            prev.autoUpload === next.autoUpload &&
            prev.autoUploadInterval === next.autoUploadInterval,
        ),
        tap((state) => {
          /**
           * 配置发生变化时，停止自动上传以让旧配置失效
           * 如果配置中仍然启用了自动上传，则重新启动自动上传
           */
          this.stopAutoUpload();

          if (state.autoUpload) {
            this.startAutoUpload();
          }
        }),
      )
      .subscribe();

    this.subscriptions = [subscription1, subscription2];
  }

  dispose() {
    this.state$.complete();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  get state() {
    return this.state$.getValue();
  }

  startAutoUpload() {
    const store = this.state;
    const delay = store.autoUploadInterval * 1000;
    this.timer = setInterval(this.autoUploadLoop.bind(this), delay);
  }

  stopAutoUpload() {
    clearInterval(this.timer);
  }

  async autoUploadLoop() {
    const limit = pLimit(1);

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
    const { rows } = await this.mdb.root().verifies().equal("szIDs", id);
    const firstRecord = rows.at(0);

    if (!firstRecord) {
      throw new Error(`未能找到#${id}对应的记录`);
    }

    const corporation = await this.mdb.app().corporation();
    const { rows: detectors } = await this.mdb
      .app()
      .detectors()
      .equal("szwheel", firstRecord.szWHModel || "");
    const { rows: datas } = await this.mdb
      .root()
      .verifies_data()
      .equal("opid", firstRecord.szIDs);

    const detectorGroup = mapGroupBy(
      detectors,
      (i) => `${i.nBoard}-${i.nChannel}`,
    );

    const dataGroup = mapGroupBy(datas, (i) => `${i.nBoard}-${i.nChannel}`);

    const images = await this.upload501ImagesByFtp(
      firstRecord.szIDs,
      corporation.DeviceNO || "",
    );

    const l01Datas = dataGroup.get(`0-3`) || [];
    const l01Detector = detectorGroup.get(`0-3`) || [];
    const l02Datas = dataGroup.get("0-4") || [];
    const l02Detector = detectorGroup.get("0-4") || [];
    const la3Datas = dataGroup.get(`0-2`) || [];
    const la3Detector = detectorGroup.get("0-2") || [];
    const r01Datas = dataGroup.get("1-3") || [];
    const r01Detector = detectorGroup.get("1-3") || [];
    const r02Datas = dataGroup.get("1-4") || [];
    const r02Detector = detectorGroup.get("1-4") || [];
    const ra3Datas = dataGroup.get("1-2") || [];
    const ra3Detector = detectorGroup.get("1-2") || [];

    const la1Datas = dataGroup.get("0-1") || [];
    const la1Detector = detectorGroup.get("0-1") || [];
    const ra1Datas = dataGroup.get("1-1") || [];
    const ra1Detector = detectorGroup.get("1-1") || [];

    const lctDatas = dataGroup.get("0-0") || [];
    const lctDetector = detectorGroup.get("0-0") || [];
    const rctDatas = dataGroup.get("1-0") || [];
    const rctDetector = detectorGroup.get("1-0") || [];

    return {
      xrsj: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      ggxh: corporation.DeviceType || "",
      zzcj: "紫云公司",
      dwmc: corporation.Factory || "",
      jyrq: dayjs(firstRecord.tmNow).format("YYYY-MM-DD HH:mm:ss"),
      swmkxh: firstRecord.szWHModel || "",

      // 左01
      ztdbh1: l01Detector?.at(0)?.szName || "",
      zzsj1: divideBy10(l01Detector?.at(0)?.nWAngle || 0),
      zjy1: divideBy10(l01Datas?.at(0)?.nAtten || 0),
      zbc1: divideBy10(l01Detector?.at(0)?.nDBSub || 0),
      zts1: divideBy10(
        (l01Datas?.at(0)?.nAtten || 0) + (l01Detector?.at(0)?.nDBSub || 0),
      ),
      zqx1_1: mathFormat(l01Datas?.at(0)?.fltValueX, {
        precision: 0,
      }),
      zqx1_2: mathFormat(l01Datas?.at(1)?.fltValueX, {
        precision: 0,
      }),
      zqx1_3: mathFormat(l01Datas?.at(2)?.fltValueX, {
        precision: 0,
      }),
      zqx1_4: mathFormat(l01Datas?.at(3)?.fltValueX, {
        precision: 0,
      }),
      zqx1_5: mathFormat(l01Datas?.at(4)?.fltValueX, {
        precision: 0,
      }),
      zqx1_6: mathFormat(l01Datas?.at(5)?.fltValueX, {
        precision: 0,
      }),
      zqx1_7: mathFormat(l01Datas?.at(6)?.fltValueX, {
        precision: 0,
      }),
      zqx1_8: mathFormat(l01Datas?.at(7)?.fltValueX, {
        precision: 0,
      }),
      zqx1_9: mathFormat(l01Datas?.at(8)?.fltValueX, {
        precision: 0,
      }),
      zqx1_10: mathFormat(l01Datas?.at(9)?.fltValueX, {
        precision: 0,
      }),
      zqx1_11: mathFormat(l01Datas?.at(10)?.fltValueX, {
        precision: 0,
      }),
      zqx1_12: mathFormat(l01Datas?.at(11)?.fltValueX, {
        precision: 0,
      }),
      zqx1_13: mathFormat(l01Datas?.at(12)?.fltValueX, {
        precision: 0,
      }),
      zqx1_14: mathFormat(l01Datas?.at(13)?.fltValueX, {
        precision: 0,
      }),
      zqx1_15: mathFormat(l01Datas?.at(14)?.fltValueX, {
        precision: 0,
      }),

      // 左02
      ztdbh2: l02Detector?.at(0)?.szName || "",
      zzsj2: divideBy10(l02Detector?.at(0)?.nWAngle || 0),
      zjy2: divideBy10(l02Datas?.at(0)?.nAtten || 0),
      zbc2: divideBy10(l02Detector?.at(0)?.nDBSub || 0),
      zts2: divideBy10(
        (l02Datas?.at(0)?.nAtten || 0) + (l02Detector?.at(0)?.nDBSub || 0),
      ),
      zqx2_1: mathFormat(l02Datas?.at(0)?.fltValueX, {
        precision: 0,
      }),
      zqx2_2: mathFormat(l02Datas?.at(1)?.fltValueX, {
        precision: 0,
      }),
      zqx2_3: mathFormat(l02Datas?.at(2)?.fltValueX, {
        precision: 0,
      }),
      zqx2_4: mathFormat(l02Datas?.at(3)?.fltValueX, {
        precision: 0,
      }),
      zqx2_5: mathFormat(l02Datas?.at(4)?.fltValueX, {
        precision: 0,
      }),
      zqx2_6: mathFormat(l02Datas?.at(5)?.fltValueX, {
        precision: 0,
      }),
      zqx2_7: mathFormat(l02Datas?.at(6)?.fltValueX, {
        precision: 0,
      }),
      zqx2_8: mathFormat(l02Datas?.at(7)?.fltValueX, {
        precision: 0,
      }),
      zqx2_9: mathFormat(l02Datas?.at(8)?.fltValueX, {
        precision: 0,
      }),
      zqx2_10: mathFormat(l02Datas?.at(9)?.fltValueX, {
        precision: 0,
      }),
      zqx2_11: mathFormat(l02Datas?.at(10)?.fltValueX, {
        precision: 0,
      }),
      zqx2_12: mathFormat(l02Datas?.at(11)?.fltValueX, {
        precision: 0,
      }),
      zqx2_13: mathFormat(l02Datas?.at(12)?.fltValueX, {
        precision: 0,
      }),
      zqx2_14: mathFormat(l02Datas?.at(13)?.fltValueX, {
        precision: 0,
      }),
      zqx2_15: mathFormat(l02Datas?.at(14)?.fltValueX, {
        precision: 0,
      }),

      // 左A3
      ztdbh3: la3Detector.at(0)?.szName || "",
      zzsj3: divideBy10(la3Detector?.at(0)?.nWAngle || 0),
      zjy3: divideBy10(la3Datas?.at(0)?.nAtten || 0),
      zbc3: divideBy10(la3Detector?.at(0)?.nDBSub || 0),
      zts3: divideBy10(
        (la3Datas?.at(0)?.nAtten || 0) + (la3Detector?.at(0)?.nDBSub || 0),
      ),
      zqx3_1: mathFormat(la3Datas?.at(0)?.fltValueX, {
        precision: 0,
      }),
      zqx3_2: mathFormat(la3Datas?.at(1)?.fltValueX, {
        precision: 0,
      }),
      zqx3_3: mathFormat(la3Datas?.at(2)?.fltValueX, {
        precision: 0,
      }),
      zqx3_4: mathFormat(la3Datas?.at(3)?.fltValueX, {
        precision: 0,
      }),
      zqx3_5: mathFormat(la3Datas?.at(4)?.fltValueX, {
        precision: 0,
      }),
      zqx3_6: mathFormat(la3Datas?.at(5)?.fltValueX, {
        precision: 0,
      }),
      zqx3_7: mathFormat(la3Datas?.at(6)?.fltValueX, {
        precision: 0,
      }),
      zqx3_8: mathFormat(la3Datas?.at(7)?.fltValueX, {
        precision: 0,
      }),
      zqx3_9: mathFormat(la3Datas?.at(8)?.fltValueX, {
        precision: 0,
      }),
      zqx3_10: mathFormat(la3Datas?.at(9)?.fltValueX, {
        precision: 0,
      }),
      zqx3_11: mathFormat(la3Datas?.at(10)?.fltValueX, {
        precision: 0,
      }),
      zqx3_12: mathFormat(la3Datas?.at(11)?.fltValueX, {
        precision: 0,
      }),
      zqx3_13: mathFormat(la3Datas?.at(12)?.fltValueX, {
        precision: 0,
      }),
      zqx3_14: mathFormat(la3Datas?.at(13)?.fltValueX, {
        precision: 0,
      }),
      zqx3_15: mathFormat(la3Datas?.at(14)?.fltValueX, {
        precision: 0,
      }),

      // 右01
      ytdbh1: r01Detector?.at(0)?.szName || "",
      yzsj1: divideBy10(r01Detector?.at(0)?.nWAngle || 0),
      yjy1: divideBy10(r01Datas?.at(0)?.nAtten || 0),
      ybc1: divideBy10(r01Detector?.at(0)?.nDBSub || 0),
      yts1: divideBy10(
        (r01Datas?.at(0)?.nAtten || 0) + (r01Detector?.at(0)?.nDBSub || 0),
      ),
      yqx1_1: mathFormat(r01Datas?.at(0)?.fltValueX, {
        precision: 0,
      }),
      yqx1_2: mathFormat(r01Datas?.at(1)?.fltValueX, {
        precision: 0,
      }),
      yqx1_3: mathFormat(r01Datas?.at(2)?.fltValueX, {
        precision: 0,
      }),
      yqx1_4: mathFormat(r01Datas?.at(3)?.fltValueX, {
        precision: 0,
      }),
      yqx1_5: mathFormat(r01Datas?.at(4)?.fltValueX, {
        precision: 0,
      }),
      yqx1_6: mathFormat(r01Datas?.at(5)?.fltValueX, {
        precision: 0,
      }),
      yqx1_7: mathFormat(r01Datas?.at(6)?.fltValueX, {
        precision: 0,
      }),
      yqx1_8: mathFormat(r01Datas?.at(7)?.fltValueX, {
        precision: 0,
      }),
      yqx1_9: mathFormat(r01Datas?.at(8)?.fltValueX, {
        precision: 0,
      }),
      yqx1_10: mathFormat(r01Datas?.at(9)?.fltValueX, {
        precision: 0,
      }),
      yqx1_11: mathFormat(r01Datas?.at(10)?.fltValueX, {
        precision: 0,
      }),
      yqx1_12: mathFormat(r01Datas?.at(11)?.fltValueX, {
        precision: 0,
      }),
      yqx1_13: mathFormat(r01Datas?.at(12)?.fltValueX, {
        precision: 0,
      }),
      yqx1_14: mathFormat(r01Datas?.at(13)?.fltValueX, {
        precision: 0,
      }),
      yqx1_15: mathFormat(r01Datas?.at(14)?.fltValueX, {
        precision: 0,
      }),

      // 右02
      ytdbh2: r02Detector?.at(0)?.szName || "",
      yzsj2: divideBy10(r02Detector?.at(0)?.nWAngle || 0),
      yjy2: divideBy10(r02Datas?.at(0)?.nAtten || 0),
      ybc2: divideBy10(r02Detector?.at(0)?.nDBSub || 0),
      yts2: divideBy10(
        (r02Datas?.at(0)?.nAtten || 0) + (r02Detector?.at(0)?.nDBSub || 0),
      ),
      yqx2_1: mathFormat(r02Datas?.at(0)?.fltValueX, {
        precision: 0,
      }),
      yqx2_2: mathFormat(r02Datas?.at(1)?.fltValueX, {
        precision: 0,
      }),
      yqx2_3: mathFormat(r02Datas?.at(2)?.fltValueX, {
        precision: 0,
      }),
      yqx2_4: mathFormat(r02Datas?.at(3)?.fltValueX, {
        precision: 0,
      }),
      yqx2_5: mathFormat(r02Datas?.at(4)?.fltValueX, {
        precision: 0,
      }),
      yqx2_6: mathFormat(r02Datas?.at(5)?.fltValueX, {
        precision: 0,
      }),
      yqx2_7: mathFormat(r02Datas?.at(6)?.fltValueX, {
        precision: 0,
      }),
      yqx2_8: mathFormat(r02Datas?.at(7)?.fltValueX, {
        precision: 0,
      }),
      yqx2_9: mathFormat(r02Datas?.at(8)?.fltValueX, {
        precision: 0,
      }),
      yqx2_10: mathFormat(r02Datas?.at(9)?.fltValueX, {
        precision: 0,
      }),
      yqx2_11: mathFormat(r02Datas?.at(10)?.fltValueX, {
        precision: 0,
      }),
      yqx2_12: mathFormat(r02Datas?.at(11)?.fltValueX, {
        precision: 0,
      }),
      yqx2_13: mathFormat(r02Datas?.at(12)?.fltValueX, {
        precision: 0,
      }),
      yqx2_14: mathFormat(r02Datas?.at(13)?.fltValueX, {
        precision: 0,
      }),
      yqx2_15: mathFormat(r02Datas?.at(14)?.fltValueX, {
        precision: 0,
      }),

      // 右A3
      ytdbh3: ra3Detector.at(0)?.szName || "",
      yzsj3: divideBy10(ra3Detector?.at(0)?.nWAngle || 0),
      yjy3: divideBy10(ra3Datas?.at(0)?.nAtten || 0),
      ybc3: divideBy10(ra3Detector?.at(0)?.nDBSub || 0),
      yts3: divideBy10(
        (ra3Datas?.at(0)?.nAtten || 0) + (ra3Detector?.at(0)?.nDBSub || 0),
      ),
      yqx3_1: mathFormat(ra3Datas?.at(0)?.fltValueX, {
        precision: 0,
      }),
      yqx3_2: mathFormat(ra3Datas?.at(1)?.fltValueX, {
        precision: 0,
      }),
      yqx3_3: mathFormat(ra3Datas?.at(2)?.fltValueX, {
        precision: 0,
      }),
      yqx3_4: mathFormat(ra3Datas?.at(3)?.fltValueX, {
        precision: 0,
      }),
      yqx3_5: mathFormat(ra3Datas?.at(4)?.fltValueX, {
        precision: 0,
      }),
      yqx3_6: mathFormat(ra3Datas?.at(5)?.fltValueX, {
        precision: 0,
      }),
      yqx3_7: mathFormat(ra3Datas?.at(6)?.fltValueX, {
        precision: 0,
      }),
      yqx3_8: mathFormat(ra3Datas?.at(7)?.fltValueX, {
        precision: 0,
      }),
      yqx3_9: mathFormat(ra3Datas?.at(8)?.fltValueX, {
        precision: 0,
      }),
      yqx3_10: mathFormat(ra3Datas?.at(9)?.fltValueX, {
        precision: 0,
      }),
      yqx3_11: mathFormat(ra3Datas?.at(10)?.fltValueX, {
        precision: 0,
      }),
      yqx3_12: mathFormat(ra3Datas?.at(11)?.fltValueX, {
        precision: 0,
      }),
      yqx3_13: mathFormat(ra3Datas?.at(12)?.fltValueX, {
        precision: 0,
      }),
      yqx3_14: mathFormat(ra3Datas?.at(13)?.fltValueX, {
        precision: 0,
      }),
      yqx3_15: mathFormat(ra3Datas?.at(14)?.fltValueX, {
        precision: 0,
      }),

      // 左A1或A2
      zzj_tdbh1: la1Detector.at(0)?.szName || "",
      zzj_zsj1: divideBy10(la1Detector?.at(0)?.nWAngle || 0),
      zzj_jy1: divideBy10(la1Datas?.at(0)?.nAtten || 0),
      zzj_bc1: divideBy10(la1Detector?.at(0)?.nDBSub || 0),
      zzj_ts1: divideBy10(
        (la1Datas?.at(0)?.nAtten || 0) + (la1Detector?.at(0)?.nDBSub || 0),
      ),
      zzj_qx1_1: mathFormat(calculateXHCFlaws(la1Datas)?.at(0)?.fltValueX, {
        precision: 0,
      }),
      zzj_qx1_2: mathFormat(calculateXHCFlaws(la1Datas)?.at(1)?.fltValueX, {
        precision: 0,
      }),
      zzj_qx1_3: mathFormat(calculateXHCFlaws(la1Datas)?.at(2)?.fltValueX, {
        precision: 0,
      }),

      // 右A1或A2
      yzj_tdbh1: ra1Detector.at(0)?.szName || "",
      yzj_zsj1: divideBy10(ra1Detector?.at(0)?.nWAngle || 0),
      yzj_jy1: divideBy10(ra1Datas?.at(0)?.nAtten || 0),
      yzj_bc1: divideBy10(ra1Detector?.at(0)?.nDBSub || 0),
      yzj_ts1: divideBy10(
        (ra1Datas?.at(0)?.nAtten || 0) + (ra1Detector?.at(0)?.nDBSub || 0),
      ),
      yzj_qx1_1: mathFormat(calculateXHCFlaws(ra1Datas)?.at(0)?.fltValueX, {
        precision: 0,
      }),
      yzj_qx1_2: mathFormat(calculateXHCFlaws(ra1Datas)?.at(1)?.fltValueX, {
        precision: 0,
      }),
      yzj_qx1_3: mathFormat(calculateXHCFlaws(ra1Datas)?.at(2)?.fltValueX, {
        precision: 0,
      }),

      // 左穿透
      zct_tdbh1: lctDetector.at(0)?.szName || "",
      zct_zsj1: divideBy10(lctDetector?.at(0)?.nWAngle || 0),
      zct_jy1: divideBy10(lctDatas?.at(0)?.nAtten || 0),
      zct_bc1: divideBy10(lctDetector?.at(0)?.nDBSub || 0),
      zct_ts1: divideBy10(
        (lctDatas?.at(0)?.nAtten || 0) + (lctDetector?.at(0)?.nDBSub || 0),
      ),
      zct_qx1_1: mathFormat(lctDatas?.at(0)?.fltValueX, {
        precision: 0,
      }),
      zct_qx1_2: mathFormat(lctDatas?.at(1)?.fltValueX, {
        precision: 0,
      }),
      zct_qx1_3: mathFormat(lctDatas?.at(2)?.fltValueX, {
        precision: 0,
      }),

      // 右穿透
      yct_tdbh1: rctDetector.at(0)?.szName || "",
      yct_zsj1: divideBy10(rctDetector?.at(0)?.nWAngle || 0),
      yct_jy1: divideBy10(rctDatas?.at(0)?.nAtten || 0),
      yct_bc1: divideBy10(rctDetector?.at(0)?.nDBSub || 0),
      yct_ts1: divideBy10(
        (rctDatas?.at(0)?.nAtten || 0) + (rctDetector?.at(0)?.nDBSub || 0),
      ),
      yct_qx1_1: mathFormat(rctDatas?.at(0)?.fltValueX, {
        precision: 0,
      }),
      yct_qx1_2: mathFormat(rctDatas?.at(1)?.fltValueX, {
        precision: 0,
      }),
      yct_qx1_3: mathFormat(rctDatas?.at(2)?.fltValueX, {
        precision: 0,
      }),

      // 12通道机设备无以下通道，直接传空
      zzj_tdbh2: "",
      zzj_zsj2: "",
      zzj_jy2: "",
      zzj_bc2: "",
      zzj_ts2: "",
      zzj_qx2_1: "",
      zzj_qx2_2: "",
      zzj_qx2_3: "",

      zzj_tdbh3: "",
      zzj_zsj3: "",
      zzj_jy3: "",
      zzj_bc3: "",
      zzj_ts3: "",
      zzj_qx3_1: "",
      zzj_qx3_2: "",
      zzj_qx3_3: "",

      yzj_tdbh2: "",
      yzj_zsj2: "",
      yzj_jy2: "",
      yzj_bc2: "",
      yzj_ts2: "",
      yzj_qx2_1: "",
      yzj_qx2_2: "",
      yzj_qx2_3: "",

      yzj_tdbh3: "",
      yzj_zsj3: "",
      yzj_jy3: "",
      yzj_bc3: "",
      yzj_ts3: "",
      yzj_qx3_1: "",
      yzj_qx3_2: "",
      yzj_qx3_3: "",

      ztdbh4: "",
      zzsj4: "",
      zjy4: "",
      zbc4: "",
      zts4: "",
      zqx4_1: "",
      zqx4_2: "",
      zqx4_3: "",
      zqx4_4: "",
      zqx4_5: "",
      zqx4_6: "",
      zqx4_7: "",
      zqx4_8: "",
      zqx4_9: "",
      zqx4_10: "",
      zqx4_11: "",
      zqx4_12: "",
      zqx4_13: "",
      zqx4_14: "",
      zqx4_15: "",

      ztdbh5: "",
      zzsj5: "",
      zjy5: "",
      zbc5: "",
      zts5: "",
      zqx5_1: "",
      zqx5_2: "",
      zqx5_3: "",
      zqx5_4: "",
      zqx5_5: "",
      zqx5_6: "",
      zqx5_7: "",
      zqx5_8: "",
      zqx5_9: "",
      zqx5_10: "",
      zqx5_11: "",
      zqx5_12: "",
      zqx5_13: "",
      zqx5_14: "",
      zqx5_15: "",

      ztdbh6: "",
      zzsj6: "",
      zjy6: "",
      zbc6: "",
      zts6: "",
      zqx6_1: "",
      zqx6_2: "",
      zqx6_3: "",
      zqx6_4: "",
      zqx6_5: "",
      zqx6_6: "",
      zqx6_7: "",
      zqx6_8: "",
      zqx6_9: "",
      zqx6_10: "",
      zqx6_11: "",
      zqx6_12: "",
      zqx6_13: "",
      zqx6_14: "",
      zqx6_15: "",

      ztdbh7: "",
      zzsj7: "",
      zjy7: "",
      zbc7: "",
      zts7: "",
      zqx7_1: "",
      zqx7_2: "",
      zqx7_3: "",
      zqx7_4: "",
      zqx7_5: "",
      zqx7_6: "",
      zqx7_7: "",
      zqx7_8: "",
      zqx7_9: "",
      zqx7_10: "",
      zqx7_11: "",
      zqx7_12: "",
      zqx7_13: "",
      zqx7_14: "",
      zqx7_15: "",

      ztdbh8: "",
      zzsj8: "",
      zjy8: "",
      zbc8: "",
      zts8: "",
      zqx8_1: "",
      zqx8_2: "",
      zqx8_3: "",
      zqx8_4: "",
      zqx8_5: "",
      zqx8_6: "",
      zqx8_7: "",
      zqx8_8: "",
      zqx8_9: "",
      zqx8_10: "",
      zqx8_11: "",
      zqx8_12: "",
      zqx8_13: "",
      zqx8_14: "",
      zqx8_15: "",

      ztdbh9: "",
      zzsj9: "",
      zjy9: "",
      zbc9: "",
      zts9: "",
      zqx9_1: "",
      zqx9_2: "",
      zqx9_3: "",
      zqx9_4: "",
      zqx9_5: "",
      zqx9_6: "",
      zqx9_7: "",
      zqx9_8: "",
      zqx9_9: "",
      zqx9_10: "",
      zqx9_11: "",
      zqx9_12: "",
      zqx9_13: "",
      zqx9_14: "",
      zqx9_15: "",

      ztdbh10: "",
      zzsj10: "",
      zjy10: "",
      zbc10: "",
      zts10: "",
      zqx10_1: "",
      zqx10_2: "",
      zqx10_3: "",
      zqx10_4: "",
      zqx10_5: "",
      zqx10_6: "",
      zqx10_7: "",
      zqx10_8: "",
      zqx10_9: "",
      zqx10_10: "",
      zqx10_11: "",
      zqx10_12: "",
      zqx10_13: "",
      zqx10_14: "",
      zqx10_15: "",

      ztdbh11: "",
      zzsj11: "",
      zjy11: "",
      zbc11: "",
      zts11: "",
      zqx11_1: "",
      zqx11_2: "",
      zqx11_3: "",
      zqx11_4: "",
      zqx11_5: "",
      zqx11_6: "",
      zqx11_7: "",
      zqx11_8: "",
      zqx11_9: "",
      zqx11_10: "",
      zqx11_11: "",
      zqx11_12: "",
      zqx11_13: "",
      zqx11_14: "",
      zqx11_15: "",

      ztdbh12: "",
      zzsj12: "",
      zbc12: "",
      zjy12: "",
      zts12: "",
      zqx12_1: "",
      zqx12_2: "",
      zqx12_3: "",
      zqx12_4: "",
      zqx12_5: "",
      zqx12_6: "",
      zqx12_7: "",
      zqx12_8: "",
      zqx12_9: "",
      zqx12_10: "",
      zqx12_11: "",
      zqx12_12: "",
      zqx12_13: "",
      zqx12_14: "",
      zqx12_15: "",

      ztdbh13: "",
      zzsj13: "",
      zjy13: "",
      zbc13: "",
      zts13: "",
      zqx13_1: "",
      zqx13_2: "",
      zqx13_3: "",
      zqx13_4: "",
      zqx13_5: "",
      zqx13_6: "",
      zqx13_7: "",
      zqx13_8: "",
      zqx13_9: "",
      zqx13_10: "",
      zqx13_11: "",
      zqx13_12: "",
      zqx13_13: "",
      zqx13_14: "",
      zqx13_15: "",

      ztdbh14: "",
      zzsj14: "",
      zjy14: "",
      zbc14: "",
      zts14: "",
      zqx14_1: "",
      zqx14_2: "",
      zqx14_3: "",
      zqx14_4: "",
      zqx14_5: "",
      zqx14_6: "",
      zqx14_7: "",
      zqx14_8: "",
      zqx14_9: "",
      zqx14_10: "",
      zqx14_11: "",
      zqx14_12: "",
      zqx14_13: "",
      zqx14_14: "",
      zqx14_15: "",

      ztdbh15: "",
      zzsj15: "",
      zjy15: "",
      zbc15: "",
      zts15: "",
      zqx15_1: "",
      zqx15_2: "",
      zqx15_3: "",
      zqx15_4: "",
      zqx15_5: "",
      zqx15_6: "",
      zqx15_7: "",
      zqx15_8: "",
      zqx15_9: "",
      zqx15_10: "",
      zqx15_11: "",
      zqx15_12: "",
      zqx15_13: "",
      zqx15_14: "",
      zqx15_15: "",

      ytdbh4: "",
      yzsj4: "",
      yjy4: "",
      ybc4: "",
      yts4: "",
      yqx4_1: "",
      yqx4_2: "",
      yqx4_3: "",
      yqx4_4: "",
      yqx4_5: "",
      yqx4_6: "",
      yqx4_7: "",
      yqx4_8: "",
      yqx4_9: "",
      yqx4_10: "",
      yqx4_11: "",
      yqx4_12: "",
      yqx4_13: "",
      yqx4_14: "",
      yqx4_15: "",

      ytdbh5: "",
      yzsj5: "",
      yjy5: "",
      ybc5: "",
      yts5: "",
      yqx5_1: "",
      yqx5_2: "",
      yqx5_3: "",
      yqx5_4: "",
      yqx5_5: "",
      yqx5_6: "",
      yqx5_7: "",
      yqx5_8: "",
      yqx5_9: "",
      yqx5_10: "",
      yqx5_11: "",
      yqx5_12: "",
      yqx5_13: "",
      yqx5_14: "",
      yqx5_15: "",

      ytdbh6: "",
      yzsj6: "",
      yjy6: "",
      ybc6: "",
      yts6: "",
      yqx6_1: "",
      yqx6_2: "",
      yqx6_3: "",
      yqx6_4: "",
      yqx6_5: "",
      yqx6_6: "",
      yqx6_7: "",
      yqx6_8: "",
      yqx6_9: "",
      yqx6_10: "",
      yqx6_11: "",
      yqx6_12: "",
      yqx6_13: "",
      yqx6_14: "",
      yqx6_15: "",

      ytdbh7: "",
      yzsj7: "",
      yjy7: "",
      ybc7: "",
      yts7: "",
      yqx7_1: "",
      yqx7_2: "",
      yqx7_3: "",
      yqx7_4: "",
      yqx7_5: "",
      yqx7_6: "",
      yqx7_7: "",
      yqx7_8: "",
      yqx7_9: "",
      yqx7_10: "",
      yqx7_11: "",
      yqx7_12: "",
      yqx7_13: "",
      yqx7_14: "",
      yqx7_15: "",

      ytdbh8: "",
      yzsj8: "",
      yjy8: "",
      ybc8: "",
      yts8: "",
      yqx8_1: "",
      yqx8_2: "",
      yqx8_3: "",
      yqx8_4: "",
      yqx8_5: "",
      yqx8_6: "",
      yqx8_7: "",
      yqx8_8: "",
      yqx8_9: "",
      yqx8_10: "",
      yqx8_11: "",
      yqx8_12: "",
      yqx8_13: "",
      yqx8_14: "",
      yqx8_15: "",

      ytdbh9: "",
      yzsj9: "",
      yjy9: "",
      ybc9: "",
      yts9: "",
      yqx9_1: "",
      yqx9_2: "",
      yqx9_3: "",
      yqx9_4: "",
      yqx9_5: "",
      yqx9_6: "",
      yqx9_7: "",
      yqx9_8: "",
      yqx9_9: "",
      yqx9_10: "",
      yqx9_11: "",
      yqx9_12: "",
      yqx9_13: "",
      yqx9_14: "",
      yqx9_15: "",

      ytdbh10: "",
      yzsj10: "",
      yjy10: "",
      ybc10: "",
      yts10: "",
      yqx10_1: "",
      yqx10_2: "",
      yqx10_3: "",
      yqx10_4: "",
      yqx10_5: "",
      yqx10_6: "",
      yqx10_7: "",
      yqx10_8: "",
      yqx10_9: "",
      yqx10_10: "",
      yqx10_11: "",
      yqx10_12: "",
      yqx10_13: "",
      yqx10_14: "",
      yqx10_15: "",

      ytdbh11: "",
      yzsj11: "",
      yjy11: "",
      ybc11: "",
      yts11: "",
      yqx11_1: "",
      yqx11_2: "",
      yqx11_3: "",
      yqx11_4: "",
      yqx11_5: "",
      yqx11_6: "",
      yqx11_7: "",
      yqx11_8: "",
      yqx11_9: "",
      yqx11_10: "",
      yqx11_11: "",
      yqx11_12: "",
      yqx11_13: "",
      yqx11_14: "",
      yqx11_15: "",

      ytdbh12: "",
      yzsj12: "",
      yjy12: "",
      ybc12: "",
      yts12: "",
      yqx12_1: "",
      yqx12_2: "",
      yqx12_3: "",
      yqx12_4: "",
      yqx12_5: "",
      yqx12_6: "",
      yqx12_7: "",
      yqx12_8: "",
      yqx12_9: "",
      yqx12_10: "",
      yqx12_11: "",
      yqx12_12: "",
      yqx12_13: "",
      yqx12_14: "",
      yqx12_15: "",

      ytdbh13: "",
      yzsj13: "",
      yjy13: "",
      ybc13: "",
      yts13: "",
      yqx13_1: "",
      yqx13_2: "",
      yqx13_3: "",
      yqx13_4: "",
      yqx13_5: "",
      yqx13_6: "",
      yqx13_7: "",
      yqx13_8: "",
      yqx13_9: "",
      yqx13_10: "",
      yqx13_11: "",
      yqx13_12: "",
      yqx13_13: "",
      yqx13_14: "",
      yqx13_15: "",

      ytdbh14: "",
      yzsj14: "",
      yjy14: "",
      ybc14: "",
      yts14: "",
      yqx14_1: "",
      yqx14_2: "",
      yqx14_3: "",
      yqx14_4: "",
      yqx14_5: "",
      yqx14_6: "",
      yqx14_7: "",
      yqx14_8: "",
      yqx14_9: "",
      yqx14_10: "",
      yqx14_11: "",
      yqx14_12: "",
      yqx14_13: "",
      yqx14_14: "",
      yqx14_15: "",

      ytdbh15: "",
      yzsj15: "",
      yjy15: "",
      ybc15: "",
      yts15: "",
      yqx15_1: "",
      yqx15_2: "",
      yqx15_3: "",
      yqx15_4: "",
      yqx15_5: "",
      yqx15_6: "",
      yqx15_7: "",
      yqx15_8: "",
      yqx15_9: "",
      yqx15_10: "",
      yqx15_11: "",
      yqx15_12: "",
      yqx15_13: "",
      yqx15_14: "",
      yqx15_15: "",
      yqx15_16: "",

      czz: firstRecord.szUsername || "",
      gz: this.state.tsgz,
      wxg: this.state.tswxg,
      zjy: this.state.tszjy,
      ysy: this.state.tsysy,
      bz: "",

      img1_mc: path.basename(images.lxhFtpPath),
      img1_lj: images.lxhFtpPath,
      img2_mc: path.basename(images.rxhFtpPath),
      img2_lj: images.rxhFtpPath,
      img3_mc: path.basename(images.llzFtpPath),
      img3_lj: images.llzFtpPath,
      img4_mc: path.basename(images.rlzFtpPath),
      img4_lj: images.rlzFtpPath,
      img5_mc: path.basename(images.lctFtpPath),
      img5_lj: images.lctFtpPath,
      img6_mc: path.basename(images.rctFtpPath),
      img6_lj: images.rctFtpPath,
      img7_mc: "",
      img7_lj: "",
      img8_mc: "",
      img8_lj: "",
      img9_mc: "",
      img9_lj: "",
      img10_mc: "",
      img10_lj: "",
      img11_mc: "",
      img11_lj: "",
      img12_mc: "",
      img12_lj: "",
      img13_mc: "",
      img13_lj: "",
      img14_mc: "",
      img14_lj: "",
      img15_mc: "",
      img15_lj: "",
      img16_mc: "",
      img16_lj: "",
      img17_mc: "",
      img17_lj: "",
      img18_mc: "",
      img18_lj: "",
      img19_mc: "",
      img19_lj: "",
      img20_mc: "",
      img20_lj: "",
    };
  }
  async resolveCHR502InputParams(ids: string[]): Promise<I502Record> {
    const { rows } = await this.mdb.root().quartors().in("szIDs", ids);

    const records = rows.toSorted(
      (a, b) =>
        (a.tmnow?.getTime() || Number.POSITIVE_INFINITY) -
        (b.tmnow?.getTime() || Number.POSITIVE_INFINITY),
    );
    const firstRecord = records.at(0);

    if (!firstRecord) {
      throw new Error(`未找到与ID ${ids.join(", ")} 相关的记录`);
    }

    const {
      rows: [previousRecord],
    } = await this.mdb
      .root()
      .quartors()
      .equal("szWHModel", firstRecord.szWHModel)
      .lt("tmnow", firstRecord.tmnow?.getTime() || Number.NEGATIVE_INFINITY)
      .orderBy("tmnow", "desc")
      .limit(1);

    const corporation = await this.mdb.app().corporation();
    const { rows: datas } = await this.mdb
      .root()
      .quartors_data()
      .in("opid", ids);
    const datasMap = mapGroupBy(datas, (item) => item.opid);
    const opid2DataMap = Array.from(datasMap).reduce((map, [opid, datas]) => {
      if (typeof opid === "string") {
        map.set(
          opid,
          mapGroupBy(datas, (item) => `${item.nBoard}-${item.nChannel}`),
        );
      }

      return map;
    }, new Map<string, Map<string, QuartorData[]>>());

    const calcAtten = (count: number, channel: string) => {
      return divideBy10(
        opid2DataMap
          .get(records.at(count)?.szIDs || "")
          ?.get(channel)
          ?.at(0)?.nAtten || 0,
      );
    };

    return {
      xrsj: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      dwmc: corporation.Factory || "",
      zzsj: firstRecord.szTMMake || "",
      zzdw: firstRecord.szIDsMake || "",
      scjxsj: previousRecord.tmnow
        ? dayjs(previousRecord.tmnow).format("YYYY-MM-DD HH:mm:ss")
        : "",
      jyrq: dayjs(firstRecord.tmnow).format("YYYY-MM-DD HH:mm:ss"),

      // 全轴穿透
      qzct_1_td: "1",
      qzct_11_z: calcAtten(0, "0-0"),
      qzct_12_z: calcAtten(1, "0-0"),
      qzct_13_z: calcAtten(2, "0-0"),
      qzct_14_z: calcAtten(3, "0-0"),
      qzct_15_z: calcAtten(4, "0-0"),
      qzct_1cz_z: calculateMaxDiff(
        calcAtten(0, "0-0"),
        calcAtten(1, "0-0"),
        calcAtten(2, "0-0"),
        calcAtten(3, "0-0"),
        calcAtten(4, "0-0"),
      ),
      qzct_11_y: calcAtten(0, "1-0"),
      qzct_12_y: calcAtten(1, "1-0"),
      qzct_13_y: calcAtten(2, "1-0"),
      qzct_14_y: calcAtten(3, "1-0"),
      qzct_15_y: calcAtten(4, "1-0"),
      qzct_1cz_y: calculateMaxDiff(
        calcAtten(0, "1-0"),
        calcAtten(1, "1-0"),
        calcAtten(2, "1-0"),
        calcAtten(3, "1-0"),
        calcAtten(4, "1-0"),
      ),
      qzct_1jg: calculateResult(
        calculateMaxDiff(
          calcAtten(0, "0-0"),
          calcAtten(1, "0-0"),
          calcAtten(2, "0-0"),
          calcAtten(3, "0-0"),
          calcAtten(4, "0-0"),
        ),
        calculateMaxDiff(
          calcAtten(0, "1-0"),
          calcAtten(1, "1-0"),
          calcAtten(2, "1-0"),
          calcAtten(3, "1-0"),
          calcAtten(4, "1-0"),
        ),
      ),

      // A1或A2
      zjgb_1_td: "1",
      zjgb_11_z: calcAtten(0, "0-1"),
      zjgb_12_z: calcAtten(1, "0-1"),
      zjgb_13_z: calcAtten(2, "0-1"),
      zjgb_14_z: calcAtten(3, "0-1"),
      zjgb_15_z: calcAtten(4, "0-1"),
      zjgb_1cz_z: calculateMaxDiff(
        calcAtten(0, "0-1"),
        calcAtten(1, "0-1"),
        calcAtten(2, "0-1"),
        calcAtten(3, "0-1"),
        calcAtten(4, "0-1"),
      ),
      zjgb_11_y: calcAtten(0, "1-1"),
      zjgb_12_y: calcAtten(1, "1-1"),
      zjgb_13_y: calcAtten(2, "1-1"),
      zjgb_14_y: calcAtten(3, "1-1"),
      zjgb_15_y: calcAtten(4, "1-1"),
      zjgb_1cz_y: calculateMaxDiff(
        calcAtten(0, "1-1"),
        calcAtten(1, "1-1"),
        calcAtten(2, "1-1"),
        calcAtten(3, "1-1"),
        calcAtten(4, "1-1"),
      ),
      zjgb_1jg: calculateResult(
        calculateMaxDiff(
          calcAtten(0, "0-1"),
          calcAtten(1, "0-1"),
          calcAtten(2, "0-1"),
          calcAtten(3, "0-1"),
          calcAtten(4, "0-1"),
        ),
        calculateMaxDiff(
          calcAtten(0, "1-1"),
          calcAtten(1, "1-1"),
          calcAtten(2, "1-1"),
          calcAtten(3, "1-1"),
          calcAtten(4, "1-1"),
        ),
      ),

      // A3
      zjgb_2_td: "2",
      zjgb_21_z: calcAtten(0, "0-2"),
      zjgb_22_z: calcAtten(1, "0-2"),
      zjgb_23_z: calcAtten(2, "0-2"),
      zjgb_24_z: calcAtten(3, "0-2"),
      zjgb_25_z: calcAtten(4, "0-2"),
      zjgb_2cz_z: calculateMaxDiff(
        calcAtten(0, "0-2"),
        calcAtten(1, "0-2"),
        calcAtten(2, "0-2"),
        calcAtten(3, "0-2"),
        calcAtten(4, "0-2"),
      ),
      zjgb_21_y: calcAtten(0, "1-2"),
      zjgb_22_y: calcAtten(1, "1-2"),
      zjgb_23_y: calcAtten(2, "1-2"),
      zjgb_24_y: calcAtten(3, "1-2"),
      zjgb_25_y: calcAtten(4, "1-2"),
      zjgb_2cz_y: calculateMaxDiff(
        calcAtten(0, "1-2"),
        calcAtten(1, "1-2"),
        calcAtten(2, "1-2"),
        calcAtten(3, "1-2"),
        calcAtten(4, "1-2"),
      ),
      zjgb_2jg: calculateResult(
        calculateMaxDiff(
          calcAtten(0, "0-2"),
          calcAtten(1, "0-2"),
          calcAtten(2, "0-2"),
          calcAtten(3, "0-2"),
          calcAtten(4, "0-2"),
        ),
        calculateMaxDiff(
          calcAtten(0, "1-2"),
          calcAtten(1, "1-2"),
          calcAtten(2, "1-2"),
          calcAtten(3, "1-2"),
          calcAtten(4, "1-2"),
        ),
      ),

      // 01
      lzxrb_1_td: "1",
      lzxrb_11_z: calcAtten(0, "0-3"),
      lzxrb_12_z: calcAtten(1, "0-3"),
      lzxrb_13_z: calcAtten(2, "0-3"),
      lzxrb_14_z: calcAtten(3, "0-3"),
      lzxrb_15_z: calcAtten(4, "0-3"),
      lzxrb_1cz_z: calculateMaxDiff(
        calcAtten(0, "0-3"),
        calcAtten(1, "0-3"),
        calcAtten(2, "0-3"),
        calcAtten(3, "0-3"),
        calcAtten(4, "0-3"),
      ),
      lzxrb_11_y: calcAtten(0, "1-3"),
      lzxrb_12_y: calcAtten(1, "1-3"),
      lzxrb_13_y: calcAtten(2, "1-3"),
      lzxrb_14_y: calcAtten(3, "1-3"),
      lzxrb_15_y: calcAtten(4, "1-3"),
      lzxrb_1cz_y: calculateMaxDiff(
        calcAtten(0, "1-3"),
        calcAtten(1, "1-3"),
        calcAtten(2, "1-3"),
        calcAtten(3, "1-3"),
        calcAtten(4, "1-3"),
      ),
      lzxrb_1jg: calculateResult(
        calculateMaxDiff(
          calcAtten(0, "0-3"),
          calcAtten(1, "0-3"),
          calcAtten(2, "0-3"),
          calcAtten(3, "0-3"),
          calcAtten(4, "0-3"),
        ),
        calculateMaxDiff(
          calcAtten(0, "1-3"),
          calcAtten(1, "1-3"),
          calcAtten(2, "1-3"),
          calcAtten(3, "1-3"),
          calcAtten(4, "1-3"),
        ),
      ),

      // 02
      lzxrb_2_td: "2",
      lzxrb_21_z: calcAtten(0, "0-4"),
      lzxrb_22_z: calcAtten(1, "0-4"),
      lzxrb_23_z: calcAtten(2, "0-4"),
      lzxrb_24_z: calcAtten(3, "0-4"),
      lzxrb_25_z: calcAtten(4, "0-4"),
      lzxrb_2cz_z: calculateMaxDiff(
        calcAtten(0, "0-4"),
        calcAtten(1, "0-4"),
        calcAtten(2, "0-4"),
        calcAtten(3, "0-4"),
        calcAtten(4, "0-4"),
      ),
      lzxrb_21_y: calcAtten(0, "1-4"),
      lzxrb_22_y: calcAtten(1, "1-4"),
      lzxrb_23_y: calcAtten(2, "1-4"),
      lzxrb_24_y: calcAtten(3, "1-4"),
      lzxrb_25_y: calcAtten(4, "1-4"),
      lzxrb_2cz_y: calculateMaxDiff(
        calcAtten(0, "1-4"),
        calcAtten(1, "1-4"),
        calcAtten(2, "1-4"),
        calcAtten(3, "1-4"),
        calcAtten(4, "1-4"),
      ),
      lzxrb_2jg: calculateResult(
        calculateMaxDiff(
          calcAtten(0, "0-4"),
          calcAtten(1, "0-4"),
          calcAtten(2, "0-4"),
          calcAtten(3, "0-4"),
          calcAtten(4, "0-4"),
        ),
        calculateMaxDiff(
          calcAtten(0, "1-4"),
          calcAtten(1, "1-4"),
          calcAtten(2, "1-4"),
          calcAtten(3, "1-4"),
          calcAtten(4, "1-4"),
        ),
      ),

      // 12通道设备无以下通道，传空
      zjgb_3_td: "",
      zjgb_31_z: "",
      zjgb_32_z: "",
      zjgb_33_z: "",
      zjgb_34_z: "",
      zjgb_35_z: "",
      zjgb_3cz_z: "",
      zjgb_31_y: "",
      zjgb_32_y: "",
      zjgb_33_y: "",
      zjgb_34_y: "",
      zjgb_35_y: "",
      zjgb_3cz_y: "",
      zjgb_3jg: "",

      lzxrb_3_td: "",
      lzxrb_31_z: "",
      lzxrb_31_y: "",
      lzxrb_32_z: "",
      lzxrb_32_y: "",
      lzxrb_33_z: "",
      lzxrb_33_y: "",
      lzxrb_34_z: "",
      lzxrb_34_y: "",
      lzxrb_35_z: "",
      lzxrb_35_y: "",
      lzxrb_3cz_z: "",
      lzxrb_3cz_y: "",
      lzxrb_3jg: "",

      lzxrb_4_td: "",
      lzxrb_41_z: "",
      lzxrb_41_y: "",
      lzxrb_42_z: "",
      lzxrb_42_y: "",
      lzxrb_43_z: "",
      lzxrb_43_y: "",
      lzxrb_44_z: "",
      lzxrb_44_y: "",
      lzxrb_45_z: "",
      lzxrb_45_y: "",
      lzxrb_4cz_z: "",
      lzxrb_4cz_y: "",
      lzxrb_4jg: "",

      lzxrb_5_td: "",
      lzxrb_51_z: "",
      lzxrb_51_y: "",
      lzxrb_52_z: "",
      lzxrb_52_y: "",
      lzxrb_53_z: "",
      lzxrb_53_y: "",
      lzxrb_54_z: "",
      lzxrb_54_y: "",
      lzxrb_55_z: "",
      lzxrb_55_y: "",
      lzxrb_5cz_z: "",
      lzxrb_5cz_y: "",
      lzxrb_5jg: "",

      lzxrb_6_td: "",
      lzxrb_61_z: "",
      lzxrb_61_y: "",
      lzxrb_62_z: "",
      lzxrb_62_y: "",
      lzxrb_63_z: "",
      lzxrb_63_y: "",
      lzxrb_64_z: "",
      lzxrb_64_y: "",
      lzxrb_65_z: "",
      lzxrb_65_y: "",
      lzxrb_6cz_z: "",
      lzxrb_6cz_y: "",
      lzxrb_6jg: "",

      lzxrb_7_td: "",
      lzxrb_71_z: "",
      lzxrb_71_y: "",
      lzxrb_72_z: "",
      lzxrb_72_y: "",
      lzxrb_73_z: "",
      lzxrb_73_y: "",
      lzxrb_74_z: "",
      lzxrb_74_y: "",
      lzxrb_75_z: "",
      lzxrb_75_y: "",
      lzxrb_7cz_z: "",
      lzxrb_7cz_y: "",
      lzxrb_7jg: "",

      lzxrb_8_td: "",
      lzxrb_81_z: "",
      lzxrb_81_y: "",
      lzxrb_82_z: "",
      lzxrb_82_y: "",
      lzxrb_83_z: "",
      lzxrb_83_y: "",
      lzxrb_84_z: "",
      lzxrb_84_y: "",
      lzxrb_85_z: "",
      lzxrb_85_y: "",
      lzxrb_8cz_z: "",
      lzxrb_8cz_y: "",
      lzxrb_8jg: "",

      lzxrb_9_td: "",
      lzxrb_91_z: "",
      lzxrb_91_y: "",
      lzxrb_92_z: "",
      lzxrb_92_y: "",
      lzxrb_93_z: "",
      lzxrb_93_y: "",
      lzxrb_94_z: "",
      lzxrb_94_y: "",
      lzxrb_95_z: "",
      lzxrb_95_y: "",
      lzxrb_9cz_z: "",
      lzxrb_9cz_y: "",
      lzxrb_9jg: "",

      lzxrb_10_td: "",
      lzxrb_101_z: "",
      lzxrb_101_y: "",
      lzxrb_102_z: "",
      lzxrb_102_y: "",
      lzxrb_103_z: "",
      lzxrb_103_y: "",
      lzxrb_104_z: "",
      lzxrb_104_y: "",
      lzxrb_105_z: "",
      lzxrb_105_y: "",
      lzxrb_10cz_z: "",
      lzxrb_10cz_y: "",
      lzxrb_10jg: "",

      lzxrb_11_td: "",
      lzxrb_111_z: "",
      lzxrb_111_y: "",
      lzxrb_112_z: "",
      lzxrb_112_y: "",
      lzxrb_113_z: "",
      lzxrb_113_y: "",
      lzxrb_114_z: "",
      lzxrb_114_y: "",
      lzxrb_115_z: "",
      lzxrb_115_y: "",
      lzxrb_11cz_z: "",
      lzxrb_11cz_y: "",
      lzxrb_11jg: "",

      lzxrb_12_td: "",
      lzxrb_121_z: "",
      lzxrb_121_y: "",
      lzxrb_122_z: "",
      lzxrb_122_y: "",
      lzxrb_123_z: "",
      lzxrb_123_y: "",
      lzxrb_124_z: "",
      lzxrb_124_y: "",
      lzxrb_125_z: "",
      lzxrb_125_y: "",
      lzxrb_12cz_z: "",
      lzxrb_12cz_y: "",
      lzxrb_12jg: "",

      lzxrb_13_td: "",
      lzxrb_131_z: "",
      lzxrb_131_y: "",
      lzxrb_132_z: "",
      lzxrb_132_y: "",
      lzxrb_133_z: "",
      lzxrb_133_y: "",
      lzxrb_134_z: "",
      lzxrb_134_y: "",
      lzxrb_135_z: "",
      lzxrb_135_y: "",
      lzxrb_13cz_z: "",
      lzxrb_13cz_y: "",
      lzxrb_13jg: "",

      lzxrb_14_td: "",
      lzxrb_141_z: "",
      lzxrb_141_y: "",
      lzxrb_142_z: "",
      lzxrb_142_y: "",
      lzxrb_143_z: "",
      lzxrb_143_y: "",
      lzxrb_144_z: "",
      lzxrb_144_y: "",
      lzxrb_145_z: "",
      lzxrb_145_y: "",
      lzxrb_14cz_z: "",
      lzxrb_14cz_y: "",
      lzxrb_14jg: "",

      lzxrb_15_td: "",
      lzxrb_151_z: "",
      lzxrb_151_y: "",
      lzxrb_152_z: "",
      lzxrb_152_y: "",
      lzxrb_153_z: "",
      lzxrb_153_y: "",
      lzxrb_154_z: "",
      lzxrb_154_y: "",
      lzxrb_155_z: "",
      lzxrb_155_y: "",
      lzxrb_15cz_z: "",
      lzxrb_15cz_y: "",
      lzxrb_15jg: "",

      lzxrb_16_td: "",
      lzxrb_161_z: "",
      lzxrb_161_y: "",
      lzxrb_162_z: "",
      lzxrb_162_y: "",
      lzxrb_163_z: "",
      lzxrb_163_y: "",
      lzxrb_164_z: "",
      lzxrb_164_y: "",
      lzxrb_165_z: "",
      lzxrb_165_y: "",
      lzxrb_16cz_z: "",
      lzxrb_16cz_y: "",
      lzxrb_16jg: "",

      lzxrb_17_td: "",
      lzxrb_171_z: "",
      lzxrb_171_y: "",
      lzxrb_172_z: "",
      lzxrb_172_y: "",
      lzxrb_173_z: "",
      lzxrb_173_y: "",
      lzxrb_174_z: "",
      lzxrb_174_y: "",
      lzxrb_175_z: "",
      lzxrb_175_y: "",
      lzxrb_17cz_z: "",
      lzxrb_17cz_y: "",
      lzxrb_17jg: "",

      lzxrb_18_td: "",
      lzxrb_181_z: "",
      lzxrb_181_y: "",
      lzxrb_182_z: "",
      lzxrb_182_y: "",
      lzxrb_183_z: "",
      lzxrb_183_y: "",
      lzxrb_184_z: "",
      lzxrb_184_y: "",
      lzxrb_185_z: "",
      lzxrb_185_y: "",
      lzxrb_18cz_z: "",
      lzxrb_18cz_y: "",
      lzxrb_18jg: "",

      lzxrb_19_td: "",
      lzxrb_191_z: "",
      lzxrb_191_y: "",
      lzxrb_192_z: "",
      lzxrb_192_y: "",
      lzxrb_193_z: "",
      lzxrb_193_y: "",
      lzxrb_194_z: "",
      lzxrb_194_y: "",
      lzxrb_195_z: "",
      lzxrb_195_y: "",
      lzxrb_19cz_z: "",
      lzxrb_19cz_y: "",
      lzxrb_19jg: "",

      lzxrb_20_td: "",
      lzxrb_201_z: "",
      lzxrb_201_y: "",
      lzxrb_202_z: "",
      lzxrb_202_y: "",
      lzxrb_203_z: "",
      lzxrb_203_y: "",
      lzxrb_204_z: "",
      lzxrb_204_y: "",
      lzxrb_205_z: "",
      lzxrb_205_y: "",
      lzxrb_20cz_z: "",
      lzxrb_20cz_y: "",
      lzxrb_20jg: "",

      lzxrb_21_td: "",
      lzxrb_211_z: "",
      lzxrb_211_y: "",
      lzxrb_212_z: "",
      lzxrb_212_y: "",
      lzxrb_213_z: "",
      lzxrb_213_y: "",
      lzxrb_214_z: "",
      lzxrb_214_y: "",
      lzxrb_215_z: "",
      lzxrb_215_y: "",
      lzxrb_21cz_z: "",
      lzxrb_21cz_y: "",
      lzxrb_21jg: "",

      lzxrb_22_td: "",
      lzxrb_221_z: "",
      lzxrb_221_y: "",
      lzxrb_222_z: "",
      lzxrb_222_y: "",
      lzxrb_223_z: "",
      lzxrb_223_y: "",
      lzxrb_224_z: "",
      lzxrb_224_y: "",
      lzxrb_225_z: "",
      lzxrb_225_y: "",
      lzxrb_22cz_z: "",
      lzxrb_22cz_y: "",
      lzxrb_22jg: "",

      lzxrb_23_td: "",
      lzxrb_231_z: "",
      lzxrb_231_y: "",
      lzxrb_232_z: "",
      lzxrb_232_y: "",
      lzxrb_233_z: "",
      lzxrb_233_y: "",
      lzxrb_234_z: "",
      lzxrb_234_y: "",
      lzxrb_235_z: "",
      lzxrb_235_y: "",
      lzxrb_23cz_z: "",
      lzxrb_23cz_y: "",
      lzxrb_23jg: "",

      lzxrb_24_td: "",
      lzxrb_241_z: "",
      lzxrb_241_y: "",
      lzxrb_242_z: "",
      lzxrb_242_y: "",
      lzxrb_243_z: "",
      lzxrb_243_y: "",
      lzxrb_244_z: "",
      lzxrb_244_y: "",
      lzxrb_245_z: "",
      lzxrb_245_y: "",
      lzxrb_24cz_z: "",
      lzxrb_24cz_y: "",
      lzxrb_24jg: "",

      lzxrb_25_td: "",
      lzxrb_251_z: "",
      lzxrb_251_y: "",
      lzxrb_252_z: "",
      lzxrb_252_y: "",
      lzxrb_253_z: "",
      lzxrb_253_y: "",
      lzxrb_254_z: "",
      lzxrb_254_y: "",
      lzxrb_255_z: "",
      lzxrb_255_y: "",
      lzxrb_25cz_z: "",
      lzxrb_25cz_y: "",
      lzxrb_25jg: "",

      lzxrb_26_td: "",
      lzxrb_261_z: "",
      lzxrb_261_y: "",
      lzxrb_262_z: "",
      lzxrb_262_y: "",
      lzxrb_263_z: "",
      lzxrb_263_y: "",
      lzxrb_264_z: "",
      lzxrb_264_y: "",
      lzxrb_265_z: "",
      lzxrb_265_y: "",
      lzxrb_26cz_z: "",
      lzxrb_26cz_y: "",
      lzxrb_26jg: "",

      lzxrb_27_td: "",
      lzxrb_271_z: "",
      lzxrb_271_y: "",
      lzxrb_272_z: "",
      lzxrb_272_y: "",
      lzxrb_273_z: "",
      lzxrb_273_y: "",
      lzxrb_274_z: "",
      lzxrb_274_y: "",
      lzxrb_275_z: "",
      lzxrb_275_y: "",
      lzxrb_27cz_z: "",
      lzxrb_27cz_y: "",
      lzxrb_27jg: "",

      lzxrb_28_td: "",
      lzxrb_281_z: "",
      lzxrb_281_y: "",
      lzxrb_282_z: "",
      lzxrb_282_y: "",
      lzxrb_283_z: "",
      lzxrb_283_y: "",
      lzxrb_284_z: "",
      lzxrb_284_y: "",
      lzxrb_285_z: "",
      lzxrb_285_y: "",
      lzxrb_28cz_z: "",
      lzxrb_28cz_y: "",
      lzxrb_28jg: "",

      lzxrb_29_td: "",
      lzxrb_291_z: "",
      lzxrb_291_y: "",
      lzxrb_292_z: "",
      lzxrb_292_y: "",
      lzxrb_293_z: "",
      lzxrb_293_y: "",
      lzxrb_294_z: "",
      lzxrb_294_y: "",
      lzxrb_295_z: "",
      lzxrb_295_y: "",
      lzxrb_29cz_z: "",
      lzxrb_29cz_y: "",
      lzxrb_29jg: "",

      lzxrb_30_td: "",
      lzxrb_301_z: "",
      lzxrb_301_y: "",
      lzxrb_302_z: "",
      lzxrb_302_y: "",
      lzxrb_303_z: "",
      lzxrb_303_y: "",
      lzxrb_304_z: "",
      lzxrb_304_y: "",
      lzxrb_305_z: "",
      lzxrb_305_y: "",
      lzxrb_30cz_z: "",
      lzxrb_30cz_y: "",
      lzxrb_30jg: "",

      lzxrb_31_td: "",
      lzxrb_311_z: "",
      lzxrb_311_y: "",
      lzxrb_312_z: "",
      lzxrb_312_y: "",
      lzxrb_313_z: "",
      lzxrb_313_y: "",
      lzxrb_314_z: "",
      lzxrb_314_y: "",
      lzxrb_315_z: "",
      lzxrb_315_y: "",
      lzxrb_31cz_z: "",
      lzxrb_31cz_y: "",
      lzxrb_31jg: "",

      lzxrb_32_td: "",
      lzxrb_321_z: "",
      lzxrb_321_y: "",
      lzxrb_322_z: "",
      lzxrb_322_y: "",
      lzxrb_323_z: "",
      lzxrb_323_y: "",
      lzxrb_324_z: "",
      lzxrb_324_y: "",
      lzxrb_325_z: "",
      lzxrb_325_y: "",
      lzxrb_32cz_z: "",
      lzxrb_32cz_y: "",
      lzxrb_32jg: "",

      lzxrb_33_td: "",
      lzxrb_331_z: "",
      lzxrb_331_y: "",
      lzxrb_332_z: "",
      lzxrb_332_y: "",
      lzxrb_333_z: "",
      lzxrb_333_y: "",
      lzxrb_334_z: "",
      lzxrb_334_y: "",
      lzxrb_335_z: "",
      lzxrb_335_y: "",
      lzxrb_33cz_z: "",
      lzxrb_33cz_y: "",
      lzxrb_33jg: "",

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

    const images = await this.upload52aImageByFtp(
      firstRecord.szIDs,
      firstRecord.szIDsWheel || "",
    );

    return {
      xrsj: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      dwmc: corporation.Factory || "",
      tssj: dayjs(firstRecord.tmnow).format("YYYY-MM-DD HH:mm:ss"),
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
  async upload501ImagesByFtp(id: string, sbbh: string) {
    const rootPath = await this.mdb.rootFolder();
    const lxhImage = this.mdb.imagePath(rootPath, `${id}.LXH.bmp`);
    const rxhImage = this.mdb.imagePath(rootPath, `${id}.RXH.bmp`);
    const llzImage = this.mdb.imagePath(rootPath, `${id}.LLZ.bmp`);
    const rlzImage = this.mdb.imagePath(rootPath, `${id}.RLZ.bmp`);
    const lctImage = this.mdb.imagePath(rootPath, `${id}.LCT.bmp`);
    const rctImage = this.mdb.imagePath(rootPath, `${id}.RCT.bmp`);
    const date = dayjs().format("YYYYMMDD");

    let lxhFtpPath = `/sbjy/rj/${sbbh + date}01.bmp`;
    let rxhFtpPath = `/sbjy/rj/${sbbh + date}02.bmp`;
    let llzFtpPath = `/sbjy/rj/${sbbh + date}03.bmp`;
    let rlzFtpPath = `/sbjy/rj/${sbbh + date}04.bmp`;
    let lctFtpPath = `/sbjy/rj/${sbbh + date}05.bmp`;
    let rctFtpPath = `/sbjy/rj/${sbbh + date}06.bmp`;

    const ftpClient = new Client();

    try {
      await ftpClient.access({
        host: this.state.ftpHost,
        port: this.state.ftpPort,
        user: this.state.ftpUser,
        password: this.state.ftpPassword,
      });

      await ftpClient.ensureDir("/sbjy/rj/");
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
