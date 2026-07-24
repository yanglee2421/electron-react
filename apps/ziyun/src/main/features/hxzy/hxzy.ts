// 成都北 华兴致远
import * as schema from "#main/features/db/schema";
import type { Logger } from "#main/features/logger";
import type { Detecotor, VerifyData } from "#main/features/mdb/types";
import { createEmit, getIP } from "#main/lib";
import { calcFlawType, calcPlace } from "#shared/functions/chr52a";
import {
  calculateXHCFlaws,
  tmnowToTSSJ,
} from "#shared/functions/flawDetection";
import { divideBy10, mathFormat } from "#shared/functions/math";
import { HXZY_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import type { HXZY_HMIS } from "#shared/instances/schema";
import { hxzy_hmis } from "#shared/instances/schema";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import { chunk, mapGroupBy } from "@yotulee/run";
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
  map,
  switchMap,
  tap,
} from "rxjs";
import type { DBClient } from "../db/types";
import type { MDB } from "../mdb";
import type { AppCradle } from "../types";
import type { CHR501Input } from "./501";
import type {
  HxzyGetResponse,
  PostRequestItem,
  PostResponse,
  Upload501Response,
} from "./types";

const emit = createEmit("api_set");

const calcFlawMap = (group: Map<string, VerifyData[]>) => {
  const result = new Map<string, string[]>();

  for (const [key, flaws] of group) {
    const type = flaws.at(0)?.nChannel;

    switch (type) {
      case 0:
        result.set(key, [
          ...new Set(
            flaws
              .toSorted((a, b) => a.fltValueX - b.fltValueX)
              .map((i) => mathFormat(i.fltValueX, { precision: 0 })),
          ),
        ]);
        break;
      case 1:
        result.set(
          key,
          calculateXHCFlaws(flaws).map((i) =>
            mathFormat(i.fltValueX, { precision: 0 }),
          ),
        );
        break;
      case 2:
      case 3:
        result.set(key, [
          ...new Set(
            flaws
              .toSorted((a, b) => a.fltValueX - b.fltValueX)
              .map((i) => mathFormat(i.fltValueX, { precision: 0 })),
          ),
        ]);
        break;
      case 4: {
        const list = [
          ...new Set(
            flaws
              .toSorted((a, b) => a.fltValueX - b.fltValueX)
              .map((i) => mathFormat(i.fltValueX, { precision: 0 })),
          ),
        ];
        result.set(
          key,
          Array.from<string>({ length: 11 - list.length })
            .map(() => "")
            .concat(list),
        );
        break;
      }
      default:
        result.set(key, []);
        break;
    }
  }

  return result;
};

interface DetectorMeta {
  zsj: string;
  jy: string;
  bc: string;
  ts: string;
}

const calcDetectorMap = (
  detectors: Detecotor[],
  flawGroup: Map<string, VerifyData[]>,
) => {
  const group = mapGroupBy(detectors, (d) => `${d.nBoard}-${d.nChannel}`);
  const map = new Map<string, DetectorMeta>();

  for (const [key, list] of group) {
    const detector = list.at(0);
    const flaw = flawGroup.get(key)?.at(0);

    if (!detector) {
      continue;
    }

    map.set(key, {
      zsj: divideBy10(detector.nWAngle),
      jy: flaw ? divideBy10(flaw.nAtten) : "",
      bc: flaw ? divideBy10(detector.nDBSub) : "",
      ts: flaw ? divideBy10(flaw.nAtten + detector.nDBSub) : "",
    });
  }

  return map;
};

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
        map((e) => {
          switch (e.action) {
            case "set":
              return hxzy_hmis.parse(e.value ? JSON.parse(e.value).state : {});
            case "remove":
            case "clear":
              return hxzy_hmis.parse({});
          }
        }),
      )
      .subscribe(this.state$);

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
    const body = JSON.stringify(request);
    const url = new URL(
      `/lzjx/dx/csbts/device_api/csbts/api/saveData`,
      `http://${this.state.ip}:${this.state.port}`,
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
      throw new Error(`#${id}未记录轴号`);
    }

    if (!record.barCode) {
      throw new Error(`#${id}未记录条形码`);
    }

    const corporation = await this.mdb.app().corporation();
    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();
    const {
      rows: [detection],
    } = await this.mdb
      .root()
      .detections()
      .equal("szIDsMake", record.zh)
      .date("tmnow", new Date(startDate), new Date(endDate));

    if (!detection) {
      throw new Error(`记录#${id}对应的检测数据不存在`);
    }

    const ip = getIP();
    const szMemo = detection.szMemo || "";
    const tssj = detection.tmnow ? tmnowToTSSJ(detection.tmnow) : "";
    const signature = detection.szUsername || "";
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
          dh: record.barCode,
          zh: record.zh || "",
          zx: detection.szWHModel || "",
          TSFF: "超声波",
          TSSJ: tssj,
          TFLAW_PLACE: "",
          TFLAW_TYPE: "",
          TVIEW: "",
          CZCTZ: signature,
          CZCTY: signature,
          LZXRBZ: signature,
          LZXRBY: signature,
          XHCZ: detection.bWheelLS ? signature : "",
          XHCY: detection.bWheelRS ? signature : "",
          TSZ: detection.szUsername || "",
          TSZY: detection.szUsername || "",
          CT_RESULT: detection.szResult || "",
        },
      ];
    }

    return memoMetas.map((meta) => {
      return {
        EQ_BH: corporation.DeviceNO || "",
        EQ_IP: ip,
        GD: this.state.gd,
        dh: record.barCode || "",
        zh: record.zh || "",
        zx: detection.szWHModel || "",
        TSFF: "超声波",
        TSSJ: tssj,
        TFLAW_PLACE: calcPlace(meta.board, meta.channel),
        TFLAW_TYPE: calcFlawType(meta.flawType),
        TVIEW: "人工复探",
        CZCTZ: signature,
        CZCTY: signature,
        LZXRBZ: signature,
        LZXRBY: signature,
        XHCZ: detection.bWheelLS ? signature : "",
        XHCY: detection.bWheelRS ? signature : "",
        TSZ: detection.szUsername || "",
        TSZY: detection.szUsername || "",
        CT_RESULT: detection.szResult || "",
      };
    });
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
    const url = new URL(
      "/lzjx/dx/csbts/device_api/csbts/api/getDate",
      `http://${this.state.ip}:${this.state.port}`,
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

    await this.sendPostRequest(postParams);
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

    const flawGroup = mapGroupBy(
      datas.rows,
      (row) => `${row.nBoard}-${row.nChannel}`,
    );
    const flawMap = calcFlawMap(flawGroup);
    const detectorMap = calcDetectorMap(detectors.rows, flawGroup);

    return {
      dwmc: corporation.Factory || "",
      jysj: record.tmNow
        ? dayjs(record.tmNow).format("YYYY-MM-DD HH:mm:ss")
        : "",
      Sbxh: corporation.DeviceType || "",
      Sbbh: corporation.DeviceNO || "",
      Swskxh: [record.szIDsWheel, record.szWHModel].join("-"),
      zsjZw: detectorMap.get("0-3")?.zsj || "",
      zsjZn: detectorMap.get("0-4")?.zsj || "",
      zsjZa1: detectorMap.get("0-2")?.zsj || "",
      zsjYw: detectorMap.get("1-3")?.zsj || "",
      zsjYn: detectorMap.get("1-4")?.zsj || "",
      zsjYa1: detectorMap.get("1-2")?.zsj || "",
      lmdJyZw: detectorMap.get("0-3")?.jy || "",
      lmdJyZn: detectorMap.get("0-4")?.jy || "",
      lmdJyZa1: detectorMap.get("0-2")?.jy || "",
      lmdJyYw: detectorMap.get("1-3")?.jy || "",
      lmdJyYn: detectorMap.get("1-4")?.jy || "",
      lmdJyYa1: detectorMap.get("1-2")?.jy || "",
      lmdBcZw: detectorMap.get("0-3")?.bc || "",
      lmdBcZn: detectorMap.get("0-4")?.bc || "",
      lmdBcZa1: detectorMap.get("0-2")?.bc || "",
      lmdBcYw: detectorMap.get("1-3")?.bc || "",
      lmdBcYn: detectorMap.get("1-4")?.bc || "",
      lmdBcYa1: detectorMap.get("1-2")?.bc || "",
      lmdTsZw: detectorMap.get("0-3")?.ts || "",
      lmdTsZn: detectorMap.get("0-4")?.ts || "",
      lmdTsZa1: detectorMap.get("0-2")?.ts || "",
      lmdTsYw: detectorMap.get("1-3")?.ts || "",
      lmdTsYn: detectorMap.get("1-4")?.ts || "",
      lmdTsYa1: detectorMap.get("1-2")?.ts || "",

      syzTd1Zw: flawMap.get("0-3")?.at(0) ? "√" : "",
      syzTd1Zn: flawMap.get("0-4")?.at(0) ? "√" : "",
      syzTd1Za1: flawMap.get("0-2")?.at(0) ? "√" : "",
      syzTd1Yw: flawMap.get("1-3")?.at(0) ? "√" : "",
      syzTd1Yn: flawMap.get("1-4")?.at(0) ? "√" : "",
      syzTd1Ya1: flawMap.get("1-2")?.at(0) ? "√" : "",

      syzTd2Zw: flawMap.get("0-3")?.at(1) ? "√" : "",
      syzTd2Zn: flawMap.get("0-4")?.at(1) ? "√" : "",
      syzTd2Za1: flawMap.get("0-2")?.at(1) ? "√" : "",
      syzTd2Yw: flawMap.get("1-3")?.at(1) ? "√" : "",
      syzTd2Yn: flawMap.get("1-4")?.at(1) ? "√" : "",
      syzTd2Ya1: flawMap.get("1-2")?.at(1) ? "√" : "",

      syzTd3Zw: flawMap.get("0-3")?.at(2) ? "√" : "",
      syzTd3Zn: flawMap.get("0-4")?.at(2) ? "√" : "",
      syzTd3Za1: flawMap.get("0-2")?.at(2) ? "√" : "",
      syzTd3Yw: flawMap.get("1-3")?.at(2) ? "√" : "",
      syzTd3Yn: flawMap.get("1-4")?.at(2) ? "√" : "",
      syzTd3Ya1: flawMap.get("1-2")?.at(2) ? "√" : "",

      syzTd4Zw: flawMap.get("0-3")?.at(3) ? "√" : "",
      syzTd4Zn: flawMap.get("0-4")?.at(3) ? "√" : "",
      syzTd4Za1: flawMap.get("0-2")?.at(3) ? "√" : "",
      syzTd4Yw: flawMap.get("1-3")?.at(3) ? "√" : "",
      syzTd4Yn: flawMap.get("1-4")?.at(3) ? "√" : "",
      syzTd4Ya1: flawMap.get("1-2")?.at(3) ? "√" : "",

      syzTd5Zw: flawMap.get("0-3")?.at(4) ? "√" : "",
      syzTd5Zn: flawMap.get("0-4")?.at(4) ? "√" : "",
      syzTd5Za1: flawMap.get("0-2")?.at(4) ? "√" : "",
      syzTd5Yw: flawMap.get("1-3")?.at(4) ? "√" : "",
      syzTd5Yn: flawMap.get("1-4")?.at(4) ? "√" : "",
      syzTd5Ya1: flawMap.get("1-2")?.at(4) ? "√" : "",

      syzTd6Zw: flawMap.get("0-3")?.at(5) ? "√" : "",
      syzTd6Zn: flawMap.get("0-4")?.at(5) ? "√" : "",
      syzTd6Za1: flawMap.get("0-2")?.at(5) ? "√" : "",
      syzTd6Yw: flawMap.get("1-3")?.at(5) ? "√" : "",
      syzTd6Yn: flawMap.get("1-4")?.at(5) ? "√" : "",
      syzTd6Ya1: flawMap.get("1-2")?.at(5) ? "√" : "",

      syzTd7Zw: flawMap.get("0-3")?.at(6) ? "√" : "",
      syzTd7Zn: flawMap.get("0-4")?.at(6) ? "√" : "",
      syzTd7Za1: flawMap.get("0-2")?.at(6) ? "√" : "",
      syzTd7Yw: flawMap.get("1-3")?.at(6) ? "√" : "",
      syzTd7Yn: flawMap.get("1-4")?.at(6) ? "√" : "",
      syzTd7Ya1: flawMap.get("1-2")?.at(6) ? "√" : "",

      syzTd8Zw: flawMap.get("0-3")?.at(7) ? "√" : "",
      syzTd8Zn: flawMap.get("0-4")?.at(7) ? "√" : "",
      syzTd8Za1: flawMap.get("0-2")?.at(7) ? "√" : "",
      syzTd8Yw: flawMap.get("1-3")?.at(7) ? "√" : "",
      syzTd8Yn: flawMap.get("1-4")?.at(7) ? "√" : "",
      syzTd8Ya1: flawMap.get("1-2")?.at(7) ? "√" : "",

      syzTd9Zw: flawMap.get("0-3")?.at(8) ? "√" : "",
      syzTd9Zn: flawMap.get("0-4")?.at(8) ? "√" : "",
      syzTd9Za1: flawMap.get("0-2")?.at(8) ? "√" : "",
      syzTd9Yw: flawMap.get("1-3")?.at(8) ? "√" : "",
      syzTd9Yn: flawMap.get("1-4")?.at(8) ? "√" : "",
      syzTd9Ya1: flawMap.get("1-2")?.at(8) ? "√" : "",

      syzTd10Zw: flawMap.get("0-3")?.at(9) ? "√" : "",
      syzTd10Zn: flawMap.get("0-4")?.at(9) ? "√" : "",
      syzTd10Za1: flawMap.get("0-2")?.at(9) ? "√" : "",
      syzTd10Yw: flawMap.get("1-3")?.at(9) ? "√" : "",
      syzTd10Yn: flawMap.get("1-4")?.at(9) ? "√" : "",
      syzTd10Ya1: flawMap.get("1-2")?.at(9) ? "√" : "",

      syzTd11Zw: flawMap.get("0-3")?.at(10) ? "√" : "",
      syzTd11Zn: flawMap.get("0-4")?.at(10) ? "√" : "",
      syzTd11Za1: flawMap.get("0-2")?.at(10) ? "√" : "",
      syzTd11Yw: flawMap.get("1-3")?.at(10) ? "√" : "",
      syzTd11Yn: flawMap.get("1-4")?.at(10) ? "√" : "",
      syzTd11Ya1: flawMap.get("1-2")?.at(10) ? "√" : "",

      syzTd12Zw: flawGroup.get("0-3")?.at(11) ? "√" : "",
      syzTd12Zn: flawMap.get("0-4")?.at(11) ? "√" : "",
      syzTd12Za1: flawGroup.get("0-2")?.at(11) ? "√" : "",
      syzTd12Yw: flawGroup.get("1-3")?.at(11) ? "√" : "",
      syzTd12Yn: flawMap.get("1-4")?.at(11) ? "√" : "",
      syzTd12Ya1: flawGroup.get("1-2")?.at(11) ? "√" : "",

      syzTd13Zw: flawGroup.get("0-3")?.at(12) ? "√" : "",
      syzTd13Zn: flawMap.get("0-4")?.at(12) ? "√" : "",
      syzTd13Za1: flawGroup.get("0-2")?.at(12) ? "√" : "",
      syzTd13Yw: flawGroup.get("1-3")?.at(12) ? "√" : "",
      syzTd13Yn: flawMap.get("1-4")?.at(12) ? "√" : "",
      syzTd13Ya1: flawGroup.get("1-2")?.at(12) ? "√" : "",

      zjCtZsjZ: detectorMap.get("0-0")?.zsj || "",
      zjCtLmdJyZ: detectorMap.get("0-0")?.jy || "",
      zjCtLmdBcZ: detectorMap.get("0-0")?.bc || "",
      zjCtLmdTsZ: detectorMap.get("0-0")?.ts || "",
      zjCtLmdQx1Z: flawMap.get("0-0")?.at(0) || "",
      zjCtLmdQx2Z: flawMap.get("0-0")?.at(1) || "",
      zjCtLmdQx3Z: flawMap.get("0-0")?.at(2) || "",

      zjCtZsjY: detectorMap.get("1-0")?.zsj || "",
      zjCtLmdJyY: detectorMap.get("1-0")?.jy || "",
      zjCtLmdBcY: detectorMap.get("1-0")?.bc || "",
      zjCtLmdTsY: detectorMap.get("1-0")?.ts || "",
      zjCtLmdQx1Y: flawMap.get("1-0")?.at(0) || "",
      zjCtLmdQx2Y: flawMap.get("1-0")?.at(1) || "",
      zjCtLmdQx3Y: flawMap.get("1-0")?.at(2) || "",

      zjA1ZsjZ:
        record.szWHModel === "RD2" ? detectorMap.get("0-1")?.zsj || "" : "",
      zjA1LmdJyZ:
        record.szWHModel === "RD2" ? detectorMap.get("0-1")?.jy || "" : "",
      zjA1LmdBcZ:
        record.szWHModel === "RD2" ? detectorMap.get("0-1")?.bc || "" : "",
      zjA1LmdTsZ:
        record.szWHModel === "RD2" ? detectorMap.get("0-1")?.ts || "" : "",
      zjA1LmdQx1Z:
        record.szWHModel === "RD2" ? flawMap.get("0-1")?.at(0) || "" : "",
      zjA1LmdQx2Z:
        record.szWHModel === "RD2" ? flawMap.get("0-1")?.at(1) || "" : "",
      zjA1LmdQx3Z:
        record.szWHModel === "RD2" ? flawMap.get("0-1")?.at(2) || "" : "",

      zjA1ZsjY:
        record.szWHModel === "RD2" ? detectorMap.get("1-1")?.zsj || "" : "",
      zjA1LmdJyY:
        record.szWHModel === "RD2" ? detectorMap.get("1-1")?.jy || "" : "",
      zjA1LmdBcY:
        record.szWHModel === "RD2" ? detectorMap.get("1-1")?.bc || "" : "",
      zjA1LmdTsY:
        record.szWHModel === "RD2" ? detectorMap.get("1-1")?.ts || "" : "",
      zjA1LmdQx1Y:
        record.szWHModel === "RD2" ? flawMap.get("1-1")?.at(0) || "" : "",
      zjA1LmdQx2Y:
        record.szWHModel === "RD2" ? flawMap.get("1-1")?.at(1) || "" : "",
      zjA1LmdQx3Y:
        record.szWHModel === "RD2" ? flawMap.get("1-1")?.at(2) || "" : "",

      zjA2ZsjZ:
        record.szWHModel === "RE2B" ? detectorMap.get("0-1")?.zsj || "" : "",
      zjA2LmdJyZ:
        record.szWHModel === "RE2B" ? detectorMap.get("0-1")?.jy || "" : "",
      zjA2LmdBcZ:
        record.szWHModel === "RE2B" ? detectorMap.get("0-1")?.bc || "" : "",
      zjA2LmdTsZ:
        record.szWHModel === "RE2B" ? detectorMap.get("0-1")?.ts || "" : "",
      zjA2LmdQx1Z:
        record.szWHModel === "RE2B" ? flawMap.get("0-1")?.at(0) || "" : "",
      zjA2LmdQx2Z:
        record.szWHModel === "RE2B" ? flawMap.get("0-1")?.at(1) || "" : "",
      zjA2LmdQx3Z:
        record.szWHModel === "RE2B" ? flawMap.get("0-1")?.at(2) || "" : "",

      zjA2ZsjY:
        record.szWHModel === "RE2B" ? detectorMap.get("1-1")?.zsj || "" : "",
      zjA2LmdJyY:
        record.szWHModel === "RE2B" ? detectorMap.get("1-1")?.jy || "" : "",
      zjA2LmdBcY:
        record.szWHModel === "RE2B" ? detectorMap.get("1-1")?.bc || "" : "",
      zjA2LmdTsY:
        record.szWHModel === "RE2B" ? detectorMap.get("1-1")?.ts || "" : "",
      zjA2LmdQx1Y:
        record.szWHModel === "RE2B" ? flawMap.get("1-1")?.at(0) || "" : "",
      zjA2LmdQx2Y:
        record.szWHModel === "RE2B" ? flawMap.get("1-1")?.at(1) || "" : "",
      zjA2LmdQx3Y:
        record.szWHModel === "RE2B" ? flawMap.get("1-1")?.at(2) || "" : "",

      Tsg: record.szUsername || "",
      Tsgz: "",
      Zjy: "",
      Ysy: "",
    };
  }
}
