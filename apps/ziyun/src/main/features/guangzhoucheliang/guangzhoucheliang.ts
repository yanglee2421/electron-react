import * as schema from "#main/features/db/schema";
import { createEmit, getIP } from "#main/lib";
import { calcFlawType, calcPlace } from "#shared/functions/chr52a";
import { tmnowToTSSJ } from "#shared/functions/flawDetection";
import { GUANGZHOU_CHELIANG_STORAGE_KEY } from "#shared/instances/constants";
import type { GuangzhoucheliangType } from "#shared/instances/schema";
import { guangzhoucheliang } from "#shared/instances/schema";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import { chunk } from "@yotulee/run";
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
import type { Logger } from "../logger";
import type { MDB } from "../mdb";
import type { AppCradle } from "../types";
import type { AlexData, UploadInput } from "./types";

const emit = createEmit("api_set");

export class Guangzhoucheliang {
  readonly state$: BehaviorSubject<GuangzhoucheliangType>;
  private db: DBClient;
  private mdb: MDB;
  private logger: Logger;
  private subscriptions: Subscription[];

  constructor({ db, mdb, logger, kv }: AppCradle) {
    this.db = db.client;
    this.mdb = mdb;
    this.logger = logger;

    const stateJSON = kv.getItem(GUANGZHOU_CHELIANG_STORAGE_KEY);
    const data = stateJSON ? JSON.parse(stateJSON).state : {};
    const state = guangzhoucheliang.parse(data);

    this.state$ = new BehaviorSubject(state);
    const sub1 = kv.events$
      .pipe(
        filter((e) => e.key === GUANGZHOU_CHELIANG_STORAGE_KEY),
        tap((e) => {
          switch (e.action) {
            case "set":
              const stateJSON = e.value;
              const data = stateJSON ? JSON.parse(stateJSON).state : {};
              const state = guangzhoucheliang.parse(data);
              this.state$.next(state);
              break;
            case "remove":
            case "clear":
              this.state$.next(guangzhoucheliang.parse({}));
              break;
          }
        }),
      )
      .subscribe();

    const sub2 = this.state$
      .pipe(
        distinctUntilChanged(
          (previous, current) =>
            previous.autoUploadEnabled === current.autoUploadEnabled &&
            previous.autoUploadInterval === current.autoUploadInterval,
        ),
        switchMap(() => {
          if (!state.autoUploadEnabled) {
            return EMPTY;
          }

          return interval(state.autoUploadInterval * 1000);
        }),
        tap(() => {
          this.handleAutoUpload();
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

  async handleScanner(barcode: string) {
    const url = new URL(
      "/pmss/vjkxx.do",
      `http://${this.state.scanner_ip}:${this.state.scanner_port}`,
    );

    url.searchParams.set("method", "getData");
    url.searchParams.set("type", "csbts");
    url.searchParams.set("param", barcode);
    this.logger.log({ title: `请求单号数据:`, message: url.href });

    const res = await net.fetch(url.href, { method: "GET" });
    const data: AlexData[] = await res.json();
    this.logger.log({ title: `返回单号数据:`, json: JSON.stringify(data) });

    return data;
  }
  async resolveUploadInput(id: number): Promise<UploadInput[]> {
    const [barcode] = await this.db
      .select()
      .from(schema.guangzhoucheliangBarcodeTable)
      .where(sql.eq(schema.guangzhoucheliangBarcodeTable.id, id))
      .limit(1);

    if (!barcode) {
      throw new Error(`#${id}不存在`);
    }

    const zh = barcode.zh;

    if (!zh) {
      throw new Error(`#${id}上未记录轴号`);
    }

    const startDate = dayjs(barcode.date).toISOString();
    const endDate = dayjs(barcode.date).endOf("day").toISOString();
    const {
      rows: [record],
    } = await this.mdb
      .root()
      .detections()
      .equal("szIDsWheel", zh)
      .date("tmnow", new Date(startDate), new Date(endDate))
      .orderBy("tmnow", "desc");

    if (!record) {
      throw new Error(`#${zh}无对应的探伤记录`);
    }

    const szMemo = record.szMemo || "";
    const corporation = await this.mdb.app().corporation();
    const signature = [
      this.state.signature_prefix,
      record.szUsername || "",
    ].join("");
    const ip = getIP();
    const tssj = record.tmnow ? tmnowToTSSJ(record.tmnow) : "";
    const memoMetas = chunk(szMemo.split(""), 8).map((i) => {
      const board = Number(i.at(0)) ? 1 : 0;
      const channel = Number(i.at(1));
      const flawType = Number(i.at(-1));

      return {
        board,
        channel,
        flawType,
      };
    });

    if (!memoMetas.length) {
      return [
        {
          EQ_BH: corporation.DeviceNO || "",
          EQ_IP: ip,
          GD: this.state.gd,
          DH: barcode.barCode || "",
          ZH: barcode.zh || "",
          ZX: record.szWHModel || "",
          TSFF: "超声波",
          TSSJ: tssj,
          TFLAW_PLACE: "",
          TFLAW_TYPE: "",
          TVIEW: "",
          CZCTZ: signature,
          CZCTY: signature,
          LZXRBZ: signature,
          LZXRBY: signature,
          XHCZ: record.bWheelLS ? signature : "",
          XHCY: record.bWheelRS ? signature : "",
          TSZ: record.szUsername || "",
          TSZY: record.szUsername || "",
          CT_RESULT: record.szResult || "",
        },
      ];
    }

    return memoMetas.map((meta) => {
      return {
        EQ_BH: corporation.DeviceNO || "",
        EQ_IP: ip,
        GD: this.state.gd,
        DH: barcode.barCode || "",
        ZH: barcode.zh || "",
        ZX: record.szWHModel || "",
        TSFF: "超声波",
        TSSJ: tssj,
        TFLAW_PLACE: calcPlace(meta.board, meta.channel),
        TFLAW_TYPE: calcFlawType(meta.flawType),
        TVIEW: "人工复探",
        CZCTZ: signature,
        CZCTY: signature,
        LZXRBZ: signature,
        LZXRBY: signature,
        XHCZ: record.bWheelLS ? signature : "",
        XHCY: record.bWheelRS ? signature : "",
        TSZ: record.szUsername || "",
        TSZY: record.szUsername || "",
        CT_RESULT: record.szResult || "",
      };
    });
  }
  async handleUpload(id: number) {
    const url = new URL(
      "/pmss/example.do",
      `http://${this.state.upload_ip}:${this.state.upload_port}`,
    );

    url.searchParams.set("method", "saveData");
    url.searchParams.set("type", "csbts");

    const input = await this.resolveUploadInput(id);
    const body = JSON.stringify(input);

    this.logger.log({ title: `请求数据:`, message: url.href, json: body });

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

    const data: boolean = await res.json();
    this.logger.log({ title: `返回数据:`, json: JSON.stringify(data) });

    await this.db
      .update(schema.guangzhoucheliangBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.guangzhoucheliangBarcodeTable.id, id))
      .returning();

    emit();

    return data;
  }
  async handleAutoUpload() {
    const limit = pLimit(1);
    const barcodes = await this.db
      .select()
      .from(schema.guangzhoucheliangBarcodeTable)
      .where(
        sql.and(
          sql.eq(schema.guangzhoucheliangBarcodeTable.isUploaded, false),
          sql.between(
            schema.guangzhoucheliangBarcodeTable.date,
            dayjs().startOf("day").toDate(),
            dayjs().endOf("day").toDate(),
          ),
        ),
      );

    await Promise.allSettled(
      barcodes.map((barcode) => limit(() => this.handleUpload(barcode.id))),
    );
  }

  async handleBarcodeDelete(id: number) {
    const result = await this.db
      .delete(schema.guangzhoucheliangBarcodeTable)
      .where(sql.eq(schema.guangzhoucheliangBarcodeTable.id, id))
      .returning();

    return result;
  }
  async handleBarcodeInsert(params: InsertRecordParams) {
    const result = await this.db
      .insert(schema.guangzhoucheliangBarcodeTable)
      .values({
        barCode: params.DH,
        zh: params.ZH,
        date: new Date(),
        isUploaded: false,
        CZZZDW: params.CZZZDW,
        CZZZRQ: params.CZZZRQ,
      })
      .returning();

    return result;
  }
  async handleBarcodeRead(params: SQLiteGetParams) {
    const rows = await this.db
      .select()
      .from(schema.guangzhoucheliangBarcodeTable)
      .where(
        sql.between(
          schema.guangzhoucheliangBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .offset(params.pageIndex * params.pageSize)
      .limit(params.pageSize)
      .orderBy();

    const [{ count }] = await this.db
      .select({ count: sql.count() })
      .from(schema.guangzhoucheliangBarcodeTable)
      .where(
        sql.between(
          schema.guangzhoucheliangBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .limit(1);

    return { rows, count };
  }
}