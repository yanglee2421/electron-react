// 成都北 华兴致远
import * as schema from "#main/features/db/schema";
import type { Logger } from "#main/features/logger";
import type { DetectionData } from "#main/features/mdb/types";
import { createEmit, getIP } from "#main/lib";
import { divideBy10, mathFormat } from "#shared/functions/math";
import { HXZY_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import type { HXZY_HMIS } from "#shared/instances/schema";
import { hxzy_hmis } from "#shared/instances/schema";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import { atFirstOrThrow, mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import { net } from "electron";
import pLimit from "p-limit";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  distinctUntilChanged,
  EMPTY,
  filter,
  interval,
  switchMap,
  tap,
} from "rxjs";
import type { DBClient } from "../db/types";
import type { MDB } from "../mdb";
import type { AppCradle } from "../types";
import type { CHR501Input } from "./501";
import type { HxzyGetResponse, Upload501Response } from "./types";

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
  code: string;
  msg: "数据上传成功";
}

const emit = createEmit("api_set");

export class Hxzy {
  readonly state$: BehaviorSubject<HXZY_HMIS>;
  private db: DBClient;
  private mdb: MDB;
  private logger: Logger;
  private subscriptions: Subscription[];

  constructor({ db, mdb, logger, kv }: AppCradle) {
    this.db = db.client;
    this.mdb = mdb;
    this.logger = logger;

    const stateJSON = kv.getItem(HXZY_HMIS_STORAGE_KEY);
    const data = stateJSON ? JSON.parse(stateJSON).state : {};
    const state = hxzy_hmis.parse(data);
    this.state$ = new BehaviorSubject(state);

    const sub1 = kv.events$
      .pipe(
        filter((e) => e.key === HXZY_HMIS_STORAGE_KEY),
        tap((e) => {
          switch (e.action) {
            case "set":
              const stateJSON = e.value;
              const data = stateJSON ? JSON.parse(stateJSON).state : {};
              const state = hxzy_hmis.parse(data);
              this.state$.next(state);
              break;
            case "remove":
            case "clear":
              this.state$.next(hxzy_hmis.parse({}));
              break;
          }
        }),
      )
      .subscribe();

    const sub2 = this.state$
      .pipe(
        distinctUntilChanged(
          (previous, current) =>
            previous.autoUpload === current.autoUpload &&
            previous.autoUploadInterval === current.autoUploadInterval,
        ),
        switchMap((state) => {
          if (!state.autoUpload) {
            return EMPTY;
          }

          return interval(state.autoUploadInterval * 1000);
        }),
        tap(() => {
          this.autoUploadLoop();
        }),
      )
      .subscribe();

    this.subscriptions = [sub1, sub2];
  }

  dispose() {
    this.state$.complete();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  get state() {
    return this.state$.getValue();
  }

  async autoUploadLoop() {
    const limit = pLimit(1);
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
  }

  async sendPostRequest(request: PostRequestItem[]) {
    const state = this.state;
    const host = state.ip + ":" + state.port;
    const body = JSON.stringify(request);

    const url = new URL(
      `http://${host}/lzjx/dx/csbts/device_api/csbts/api/saveData`,
    );

    url.searchParams.set("type", "csbts");
    this.logger.log({
      title: `请求数据:`,
      json: body,
      message: url.href,
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
      json: JSON.stringify(data),
      message: url.href,
    });

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

    const store = this.state;
    const corporation = await this.mdb.app().corporation();
    const EQ_IP = corporation.DeviceNO || "";
    const EQ_BH = getIP();
    const GD = store.gd;
    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();

    const detections = await this.mdb
      .root()
      .detections()
      .equal("szIDsMake", record.zh)
      .date("tmnow", new Date(startDate), new Date(endDate));

    const detection = atFirstOrThrow(
      detections.rows,
      () => new Error(`记录#${id}对应的检测数据不存在`),
    );
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
        detectionDatas = await this.mdb
          .root()
          .detections_data()
          .equal("opid", detection.szIDs)
          .then((r) => r.rows);
        break;
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
    const state = this.state;
    const host = state.ip + ":" + state.port;

    const url = new URL(
      `http://${host}/lzjx/dx/csbts/device_api/csbts/api/getDate`,
    );

    url.searchParams.set("type", "csbts");
    url.searchParams.set("param", dh);
    this.logger.log({ title: `请求数据:`, message: url.href });

    const res = await net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: HxzyGetResponse = await res.json();
    this.logger.log({ title: `返回数据:`, message: JSON.stringify(data) });

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
  async upload501(id: string) {
    const input = await this.resolve501Input(id);
    const body = JSON.stringify(input);
    const state = this.state;
    const host = state.ip + ":" + state.port;

    const url = new URL(
      `http://${host}/lzjx/dx/csbts/device_api/csbts/api/saveRcxnjy.json`,
    );

    this.logger.log({
      title: `请求数据:`,
      json: body,
      message: url.href,
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

    const data: Upload501Response = await res.json();
    this.logger.log({
      title: `返回数据:`,
      json: JSON.stringify(data),
      message: url.href,
    });

    if (data.code !== "200") {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }

  async resolve501Input(id: string): Promise<CHR501Input> {
    const {
      rows: [record],
    } = await this.mdb.root().verifies().equal("szIDs", id);

    if (!record) {
      throw new Error(`未找到#${id}记录`);
    }

    const datas = await this.mdb.root().verifies_data().equal("opid", id);
    const corporation = await this.mdb.app().corporation();
    const detectors = await this.mdb
      .app()
      .detectors()
      .equal("szwheel", record.szWHModel || "");

    const detectorMap = mapGroupBy(
      detectors.rows,
      (row) => `${row.nBoard}-${row.nChannel}`,
    );
    const flawMap = mapGroupBy(
      datas.rows,
      (row) => `${row.nBoard}-${row.nChannel}`,
    );

    return {
      dwmc: corporation.Factory || "",
      jysj: record.tmNow
        ? dayjs(record.tmNow).format("YYYY-MM-DD HH:mm:ss")
        : "",
      Sbxh: corporation.DeviceType || "",
      Sbbh: corporation.DeviceNO || "",
      Swskxh: [record.szIDsWheel, record.szWHModel].join("-"),
      zsjZw: divideBy10(detectorMap.get("0-3")?.at(0)?.nWAngle || 0),
      zsjZn: divideBy10(detectorMap.get("0-4")?.at(0)?.nWAngle || 0),
      zsjZa1: divideBy10(detectorMap.get("0-2")?.at(0)?.nWAngle || 0),
      zsjYw: divideBy10(detectorMap.get("1-3")?.at(0)?.nWAngle || 0),
      zsjYn: divideBy10(detectorMap.get("1-4")?.at(0)?.nWAngle || 0),
      zsjYa1: divideBy10(detectorMap.get("1-2")?.at(0)?.nWAngle || 0),
      lmdJyZw: divideBy10(flawMap.get("0-3")?.at(0)?.nAtten || 0),
      lmdJyZn: divideBy10(flawMap.get("0-4")?.at(0)?.nAtten || 0),
      lmdJyZa1: divideBy10(flawMap.get("0-2")?.at(0)?.nAtten || 0),
      lmdJyYw: divideBy10(flawMap.get("1-3")?.at(0)?.nAtten || 0),
      lmdJyYn: divideBy10(flawMap.get("1-4")?.at(0)?.nAtten || 0),
      lmdJyYa1: divideBy10(flawMap.get("1-2")?.at(0)?.nAtten || 0),
      lmdBcZw: divideBy10(detectorMap.get("0-3")?.at(0)?.nDBSub || 0),
      lmdBcZn: divideBy10(detectorMap.get("0-4")?.at(0)?.nDBSub || 0),
      lmdBcZa1: divideBy10(detectorMap.get("0-2")?.at(0)?.nDBSub || 0),
      lmdBcYw: divideBy10(detectorMap.get("1-3")?.at(0)?.nDBSub || 0),
      lmdBcYn: divideBy10(detectorMap.get("1-4")?.at(0)?.nDBSub || 0),
      lmdBcYa1: divideBy10(detectorMap.get("1-2")?.at(0)?.nDBSub || 0),
      lmdTsZw: divideBy10(
        (detectorMap.get("0-3")?.at(0)?.nDBSub || 0) +
          (flawMap.get("0-3")?.at(0)?.nAtten || 0),
      ),
      lmdTsZn: divideBy10(
        (detectorMap.get("0-4")?.at(0)?.nDBSub || 0) +
          (flawMap.get("0-4")?.at(0)?.nAtten || 0),
      ),
      lmdTsZa1: divideBy10(
        (detectorMap.get("0-2")?.at(0)?.nDBSub || 0) +
          (flawMap.get("0-2")?.at(0)?.nAtten || 0),
      ),
      lmdTsYw: divideBy10(
        (detectorMap.get("1-3")?.at(0)?.nDBSub || 0) +
          (flawMap.get("1-3")?.at(0)?.nAtten || 0),
      ),
      lmdTsYn: divideBy10(
        (detectorMap.get("1-4")?.at(0)?.nDBSub || 0) +
          (flawMap.get("1-4")?.at(0)?.nAtten || 0),
      ),
      lmdTsYa1: divideBy10(
        (detectorMap.get("1-2")?.at(0)?.nDBSub || 0) +
          (flawMap.get("1-2")?.at(0)?.nAtten || 0),
      ),
      syzTd1Zw: flawMap.get("0-3")?.at(0) ? "√" : "",
      syzTd1Zn: flawMap.get("0-4")?.at(-11) ? "√" : "",
      syzTd1Za1: flawMap.get("0-2")?.at(0) ? "√" : "",
      syzTd1Yw: flawMap.get("1-3")?.at(0) ? "√" : "",
      syzTd1Yn: flawMap.get("1-4")?.at(-11) ? "√" : "",
      syzTd1Ya1: flawMap.get("1-2")?.at(0) ? "√" : "",

      syzTd2Zw: flawMap.get("0-3")?.at(1) ? "√" : "",
      syzTd2Zn: flawMap.get("0-4")?.at(-10) ? "√" : "",
      syzTd2Za1: flawMap.get("0-2")?.at(1) ? "√" : "",
      syzTd2Yw: flawMap.get("1-3")?.at(1) ? "√" : "",
      syzTd2Yn: flawMap.get("1-4")?.at(-10) ? "√" : "",
      syzTd2Ya1: flawMap.get("1-2")?.at(1) ? "√" : "",

      syzTd3Zw: flawMap.get("0-3")?.at(2) ? "√" : "",
      syzTd3Zn: flawMap.get("0-4")?.at(-9) ? "√" : "",
      syzTd3Za1: flawMap.get("0-2")?.at(2) ? "√" : "",
      syzTd3Yw: flawMap.get("1-3")?.at(2) ? "√" : "",
      syzTd3Yn: flawMap.get("1-4")?.at(-9) ? "√" : "",
      syzTd3Ya1: flawMap.get("1-2")?.at(2) ? "√" : "",

      syzTd4Zw: flawMap.get("0-3")?.at(3) ? "√" : "",
      syzTd4Zn: flawMap.get("0-4")?.at(-8) ? "√" : "",
      syzTd4Za1: flawMap.get("0-2")?.at(3) ? "√" : "",
      syzTd4Yw: flawMap.get("1-3")?.at(3) ? "√" : "",
      syzTd4Yn: flawMap.get("1-4")?.at(-8) ? "√" : "",
      syzTd4Ya1: flawMap.get("1-2")?.at(3) ? "√" : "",

      syzTd5Zw: flawMap.get("0-3")?.at(4) ? "√" : "",
      syzTd5Zn: flawMap.get("0-4")?.at(-7) ? "√" : "",
      syzTd5Za1: flawMap.get("0-2")?.at(4) ? "√" : "",
      syzTd5Yw: flawMap.get("1-3")?.at(4) ? "√" : "",
      syzTd5Yn: flawMap.get("1-4")?.at(-7) ? "√" : "",
      syzTd5Ya1: flawMap.get("1-2")?.at(4) ? "√" : "",

      syzTd6Zw: flawMap.get("0-3")?.at(5) ? "√" : "",
      syzTd6Zn: flawMap.get("0-4")?.at(-6) ? "√" : "",
      syzTd6Za1: flawMap.get("0-2")?.at(5) ? "√" : "",
      syzTd6Yw: flawMap.get("1-3")?.at(5) ? "√" : "",
      syzTd6Yn: flawMap.get("1-4")?.at(-6) ? "√" : "",
      syzTd6Ya1: flawMap.get("1-2")?.at(5) ? "√" : "",

      syzTd7Zw: flawMap.get("0-3")?.at(6) ? "√" : "",
      syzTd7Zn: flawMap.get("0-4")?.at(-5) ? "√" : "",
      syzTd7Za1: flawMap.get("0-2")?.at(6) ? "√" : "",
      syzTd7Yw: flawMap.get("1-3")?.at(6) ? "√" : "",
      syzTd7Yn: flawMap.get("1-4")?.at(-5) ? "√" : "",
      syzTd7Ya1: flawMap.get("1-2")?.at(6) ? "√" : "",

      syzTd8Zw: flawMap.get("0-3")?.at(7) ? "√" : "",
      syzTd8Zn: flawMap.get("0-4")?.at(-4) ? "√" : "",
      syzTd8Za1: flawMap.get("0-2")?.at(7) ? "√" : "",
      syzTd8Yw: flawMap.get("1-3")?.at(7) ? "√" : "",
      syzTd8Yn: flawMap.get("1-4")?.at(-4) ? "√" : "",
      syzTd8Ya1: flawMap.get("1-2")?.at(7) ? "√" : "",

      syzTd9Zw: flawMap.get("0-3")?.at(8) ? "√" : "",
      syzTd9Zn: flawMap.get("0-4")?.at(-3) ? "√" : "",
      syzTd9Za1: flawMap.get("0-2")?.at(8) ? "√" : "",
      syzTd9Yw: flawMap.get("1-3")?.at(8) ? "√" : "",
      syzTd9Yn: flawMap.get("1-4")?.at(-3) ? "√" : "",
      syzTd9Ya1: flawMap.get("1-2")?.at(8) ? "√" : "",

      syzTd10Zw: flawMap.get("0-3")?.at(9) ? "√" : "",
      syzTd10Zn: flawMap.get("0-4")?.at(-2) ? "√" : "",
      syzTd10Za1: flawMap.get("0-2")?.at(9) ? "√" : "",
      syzTd10Yw: flawMap.get("1-3")?.at(9) ? "√" : "",
      syzTd10Yn: flawMap.get("1-4")?.at(-2) ? "√" : "",
      syzTd10Ya1: flawMap.get("1-2")?.at(9) ? "√" : "",

      syzTd11Zw: flawMap.get("0-3")?.at(10) ? "√" : "",
      syzTd11Zn: flawMap.get("0-4")?.at(-1) ? "√" : "",
      syzTd11Za1: flawMap.get("0-2")?.at(10) ? "√" : "",
      syzTd11Yw: flawMap.get("1-3")?.at(10) ? "√" : "",
      syzTd11Yn: flawMap.get("1-4")?.at(-1) ? "√" : "",
      syzTd11Ya1: flawMap.get("1-2")?.at(10) ? "√" : "",

      syzTd12Zw: flawMap.get("0-3")?.at(11) ? "√" : "",
      syzTd12Zn: "",
      syzTd12Za1: flawMap.get("0-2")?.at(11) ? "√" : "",
      syzTd12Yw: flawMap.get("1-3")?.at(11) ? "√" : "",
      syzTd12Yn: "",
      syzTd12Ya1: flawMap.get("1-2")?.at(11) ? "√" : "",

      syzTd13Zw: flawMap.get("0-3")?.at(12) ? "√" : "",
      syzTd13Zn: "",
      syzTd13Za1: flawMap.get("0-2")?.at(12) ? "√" : "",
      syzTd13Yw: flawMap.get("1-3")?.at(12) ? "√" : "",
      syzTd13Yn: "",
      syzTd13Ya1: flawMap.get("1-2")?.at(12) ? "√" : "",

      zjCtZsjZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjCtLmdJyZ: divideBy10(flawMap.get("0-0")?.at(0)?.nAtten || 0),
      zjCtLmdBcZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nDBSub || 0),
      zjCtLmdTsZ: divideBy10(
        (detectorMap.get("0-0")?.at(0)?.nDBSub || 0) +
          (flawMap.get("0-0")?.at(0)?.nAtten || 0),
      ),
      zjCtLmdQx1Z: flawMap.get("0-0")?.at(0)?.fltValueX
        ? mathFormat(flawMap.get("0-0")?.at(0)?.fltValueX, {
            notation: "fixed",
            precision: 0,
          })
        : "",
      zjCtLmdQx2Z: flawMap.get("0-0")?.at(1)?.fltValueX
        ? mathFormat(flawMap.get("0-0")?.at(1)?.fltValueX, {
            notation: "fixed",
            precision: 0,
          })
        : "",
      zjCtLmdQx3Z: flawMap.get("0-0")?.at(2)?.fltValueX
        ? mathFormat(flawMap.get("0-0")?.at(2)?.fltValueX, {
            notation: "fixed",
            precision: 0,
          })
        : "",

      zjCtZsjY: divideBy10(detectorMap.get("1-0")?.at(0)?.nWAngle || 0),
      zjCtLmdJyY: divideBy10(flawMap.get("1-0")?.at(0)?.nAtten || 0),
      zjCtLmdBcY: divideBy10(detectorMap.get("1-0")?.at(0)?.nDBSub || 0),
      zjCtLmdTsY: divideBy10(
        (detectorMap.get("1-0")?.at(0)?.nDBSub || 0) +
          (flawMap.get("1-0")?.at(0)?.nAtten || 0),
      ),
      zjCtLmdQx1Y: divideBy10(detectorMap.get("1-0")?.at(0)?.nWAngle || 0),
      zjCtLmdQx2Y: divideBy10(detectorMap.get("1-0")?.at(0)?.nWAngle || 0),
      zjCtLmdQx3Y: divideBy10(detectorMap.get("1-0")?.at(0)?.nWAngle || 0),

      zjA1ZsjZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdJyZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdBcZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdTsZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdQx1Z: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdQx2Z: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdQx3Z: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),

      zjA1ZsjY: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdJyY: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdBcY: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdTsY: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdQx1Y: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdQx2Y: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA1LmdQx3Y: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),

      zjA2ZsjZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdJyZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdBcZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdTsZ: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdQx1Z: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdQx2Z: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdQx3Z: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),

      zjA2ZsjY: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdJyY: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdBcY: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdTsY: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdQx1Y: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdQx2Y: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),
      zjA2LmdQx3Y: divideBy10(detectorMap.get("0-0")?.at(0)?.nWAngle || 0),

      Tsg: record.szUsername || "",
      Tsgz: "",
      Zjy: "",
      Ysy: "",
    };
  }
}