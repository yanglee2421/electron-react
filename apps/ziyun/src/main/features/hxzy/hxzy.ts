// 成都北 华兴致远
import * as schema from "#main/features/db/schema";
import type { Logger } from "#main/features/logger";
import type { DetectionData } from "#main/features/mdb/types";
import { createEmit, getIP } from "#main/lib";
import { HXZY_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import type { HXZY_HMIS } from "#shared/instances/schema";
import { hxzy_hmis } from "#shared/instances/schema";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import { atFirstOrThrow } from "@yotulee/run";
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
import type { HxzyGetResponse } from "./types";

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
    this.logger.error({ title: `请求数据:`, message: url.href });

    const res = await net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: HxzyGetResponse = await res.json();
    this.logger.error({ title: `返回数据:`, message: JSON.stringify(data) });

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