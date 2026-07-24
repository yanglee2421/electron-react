// 京天威 统型

import * as schema from "#main/features/db/schema";
import type { DBClient } from "#main/features/db/types";
import type { Logger } from "#main/features/logger";
import { createEmit, getIP } from "#main/lib";
import { calcFlawType, calcPlace } from "#shared/functions/chr52a";
import { tmnowToTSSJ } from "#shared/functions/flawDetection";
import { JTV_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import type { JTV_HMIS } from "#shared/instances/schema";
import { jtv_hmis } from "#shared/instances/schema";
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
  map,
  switchMap,
  tap,
} from "rxjs";
import type { MDB } from "../mdb";
import type { AppCradle } from "../types";

interface ZH_Item {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZRQ: string;
  CZZZDW: string;
  SCZZRQ: string;
  SCZZDW: string;
  MCZZRQ: string;
  MCZZDW: string;

  LBZGZPH: string | null;
  CLLWKSRZ: number | null;
  CLLWKSRY: number | null;
  PJ_ID: string | null;
  LBYGZPH: string | null;
  LBYLH: string | null;
  LBZCDH: string | null;
  LBYLX: string | null;
  CLLWHSRY: number | null;
  CLLWHSRZ: number | null;
  LBZSXH: string | null;
  CLZJSRY: number | null;
  CLZJSRZ: number | null;
  LBYZZRQ: string | null;
  LBZLH: string | null;
  LBZZZRQ: string | null;
  LBYSXH: string | null;
  LBZLX: string | null;
  LBYCDH: string | null;
}

interface ZH_Response {
  code: string;
  msg: string;
  data: ZH_Item[];
}

interface DH_Item {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZDW: string;
  CZZZRQ: string;
  MCZZDW: string;
  MCZZRQ: string;
  SCZZDW: string;
  SCZZRQ: string;

  SRYY?: string | null;
  SRDW?: string | null;
}

interface DH_Response {
  code: string;
  msg: string;
  data: DH_Item[];
}

interface PostItem {
  eq_ip: string; // 设备IP
  eq_bh: string; // 设备编号
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
  msg: string;
}

const normalizeZHResponse = (data: ZH_Response) => {
  if (data.code !== "200") {
    throw new Error(data.msg);
  }

  return data.data.map((record) => {
    return {
      DH: record.DH,
      ZH: record.ZH,
      ZX: record.ZX,
      CZZZDW: record.CZZZDW,
      CZZZRQ: record.CZZZRQ,
      MCZZDW: record.MCZZDW,
      MCZZRQ: record.MCZZRQ,
      SCZZDW: record.SCZZDW,
      SCZZRQ: record.SCZZRQ,
    };
  });
};

const normalizeDHResponse = (data: DH_Response) => {
  if (data.code !== "200") {
    throw new Error(data.msg);
  }

  return data.data.map((record) => {
    return {
      DH: record.DH,
      ZH: record.ZH,
      ZX: record.ZX,
      CZZZDW: record.CZZZDW,
      CZZZRQ: record.CZZZRQ,
      MCZZDW: record.MCZZDW,
      MCZZRQ: record.MCZZRQ,
      SCZZDW: record.SCZZDW,
      SCZZRQ: record.SCZZRQ,
    };
  });
};

const emit = createEmit("api_set");

export class JTV {
  readonly state$: BehaviorSubject<JTV_HMIS>;
  private db: DBClient;
  private mdb: MDB;
  private logger: Logger;
  private subscriptions: Subscription[];

  constructor({ db, mdb, logger, kv }: AppCradle) {
    this.db = db.client;
    this.mdb = mdb;
    this.logger = logger;

    const stateJson = kv.getItem(JTV_HMIS_STORAGE_KEY);
    const state = stateJson ? JSON.parse(stateJson).state : {};
    const initialState = jtv_hmis.parse(state);
    this.state$ = new BehaviorSubject<JTV_HMIS>(initialState);

    const subscription1 = kv.events$
      .pipe(
        filter((e) => e.key === JTV_HMIS_STORAGE_KEY),
        map((e) => {
          switch (e.action) {
            case "set":
              return jtv_hmis.parse(e.value ? JSON.parse(e.value).state : {});
            case "remove":
            case "clear":
              return jtv_hmis.parse({});
          }
        }),
      )
      .subscribe(this.state$);

    const subscription2 = this.state$
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

    this.subscriptions = [subscription1, subscription2];
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
      .from(schema.jtvBarcodeTable)
      .where(
        sql.and(
          sql.eq(schema.jtvBarcodeTable.isUploaded, false),
          sql.between(
            schema.jtvBarcodeTable.date,
            dayjs().startOf("day").toDate(),
            dayjs().endOf("day").toDate(),
          ),
        ),
      );

    await Promise.allSettled(
      barcodes.map((barcode) => limit(() => this.handleUpload(barcode.id))),
    );
  }

  makeDataRequestURL(dh: string) {
    const store = this.state;
    const host = store.ip + ":" + store.port;
    const unitCode = store.unitCode;
    const url = new URL(`http://${host}/api/getData`);

    url.searchParams.set("param", [dh, unitCode].join(","));

    return url;
  }

  async fetchAxleInfoByZH(zh: string) {
    const url = this.makeDataRequestURL(zh);

    url.searchParams.set("type", "csbtszh");
    this.logger.log({ title: `请求轴号数据:`, message: url.href });

    const res = await net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw new Error(`接口异常[${res.status}]:${res.statusText}`);
    }

    const data: ZH_Response = await res.json();
    this.logger.log({ title: `返回轴号数据:`, json: JSON.stringify(data) });

    if (data.code !== "200") {
      throw new Error(data.msg);
    }

    return data;
  }

  async fetchAxleInfoByDH(dh: string) {
    const url = this.makeDataRequestURL(dh);

    url.searchParams.set("type", "csbts");
    this.logger.log({ title: `请求单号数据:`, message: url.href });

    const res = await net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw new Error(`接口异常[${res.status}]:${res.statusText}`);
    }

    const data: DH_Response = await res.json();
    this.logger.log({ title: `返回单号数据:`, json: JSON.stringify(data) });

    if (data.code !== "200") {
      throw new Error(data.msg);
    }

    return data;
  }

  async sendPostRequest(request: PostItem[]) {
    const body = JSON.stringify(request);
    const url = new URL(
      "/api/saveData",
      `http://${this.state.ip}:${this.state.port}`,
    );
    url.searchParams.set("type", "csbts");
    this.logger.log({
      title: `发送作业数据:`,
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
    this.logger.log({ title: `返回数据:`, json: JSON.stringify(data) });

    if (data.code !== "200") {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }

  async recordToBody(record: schema.JTVBarcode) {
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
      .equal("szIDsWheel", record.zh)
      .date("tmnow", new Date(startDate), new Date(endDate))
      .orderBy("tmnow", "desc");

    if (!detection) {
      throw new Error(`记录#${id}对应的检测数据不存在`);
    }

    const ip = getIP();
    const szMemo = detection.szMemo || "";
    const tssj = detection.tmnow ? tmnowToTSSJ(detection.tmnow) : "";
    const signature = [
      this.state.signature_prefix,
      detection.szUsername || "",
    ].join("");
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
          eq_bh: corporation.DeviceNO || "",
          eq_ip: ip,
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
        eq_bh: corporation.DeviceNO || "",
        eq_ip: ip,
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

  async handleFetch(dh: string, isZhMode?: boolean) {
    if (isZhMode) {
      const data = await this.fetchAxleInfoByZH(dh);
      const result = normalizeZHResponse(data);

      return result;
    } else {
      const data = await this.fetchAxleInfoByDH(dh);
      const result = normalizeDHResponse(data);

      return result;
    }
  }
  async handleUpload(id: number) {
    const [record] = await this.db
      .select()
      .from(schema.jtvBarcodeTable)
      .where(sql.eq(schema.jtvBarcodeTable.id, id));

    if (!record) {
      throw new Error(`记录#${id}不存在`);
    }

    const body = await this.recordToBody(record);
    await this.sendPostRequest(body);

    const result = await this.db
      .update(schema.jtvBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.jtvBarcodeTable.id, record.id))
      .returning();

    emit();

    return result;
  }
  async handleReadRecord(params: SQLiteGetParams) {
    const [{ count }] = await this.db
      .select({ count: sql.count() })
      .from(schema.jtvBarcodeTable)
      .where(
        sql.between(
          schema.jtvBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .limit(1);

    const rows = await this.db._query.jtvBarcodeTable.findMany({
      where: sql.between(
        schema.jtvBarcodeTable.date,
        new Date(params.startDate),
        new Date(params.endDate),
      ),
      offset: params.pageIndex * params.pageSize,
      limit: params.pageSize,
      orderBy: sql.desc(schema.jtvBarcodeTable.date),
    });

    return { rows, count };
  }
  handleDeleteRecord(id: number) {
    return this.db
      .delete(schema.jtvBarcodeTable)
      .where(sql.eq(schema.jtvBarcodeTable.id, id))
      .returning();
  }
  handleInsertRecord(data: InsertRecordParams) {
    return this.db
      .insert(schema.jtvBarcodeTable)
      .values({
        barCode: data.DH,
        zh: data.ZH,
        date: new Date(),
        isUploaded: false,
        CZZZDW: data.CZZZDW,
        CZZZRQ: data.CZZZRQ,
      })
      .returning();
  }
}