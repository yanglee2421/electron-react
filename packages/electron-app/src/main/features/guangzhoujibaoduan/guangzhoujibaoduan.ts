// 京天威 广州机保段
import * as schema from "#main/features/db/schema";
import type { Logger } from "#main/features/logger";
import type { MDB } from "#main/features/mdb";
import type { Detection, DetectionData } from "#main/features/mdb/types";
import { createEmit, getIP } from "#main/lib";
import {
  detectionDataToTPlace,
  tmnowToTSSJ,
} from "#shared/functions/flawDetection";
import { GUANGZHOU_JIBAODUAN_STORAGE_KEY } from "#shared/instances/constants";
import type { Guangzhoujibaoduan } from "#shared/instances/schema";
import { guangzhoujibaoduan } from "#shared/instances/schema";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import { atFirstOrThrow } from "@yotulee/run";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import { net } from "electron";
import pLimit from "p-limit";
import { BehaviorSubject } from "rxjs";
import type { DBClient } from "../db/types";
import type { AppCradle } from "../types";

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

  ZTX?: boolean;
  YTX?: boolean;
}

interface DH_Response {
  code: string;
  msg: string;
  data: DH_Item[];
}

export interface NormalizeResponse {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZDW: string;
  CZZZRQ: string;
  MCZZDW: string;
  MCZZRQ: string;
  SCZZDW: string;
  SCZZRQ: string;

  ZTX?: boolean;
  YTX?: boolean;
}

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
      ZTX: record.ZTX,
      YTX: record.YTX,
    };
  });
};

const emit = createEmit("api_set");

export class JTV_HMIS_Guangzhoujibaoduan {
  private state$: BehaviorSubject<Guangzhoujibaoduan>;
  private db: DBClient;
  private mdb: MDB;
  private logger: Logger;

  constructor({ db, mdb, logger, kv }: AppCradle) {
    this.db = db.client;
    this.mdb = mdb;
    this.logger = logger;

    const stateJSON = kv.getItem(GUANGZHOU_JIBAODUAN_STORAGE_KEY);
    const data = stateJSON ? JSON.parse(stateJSON).state : {};
    const state = guangzhoujibaoduan.parse(data);

    this.state$ = new BehaviorSubject(state);
  }

  dispose() {}

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
        .from(schema.jtvGuangzhoujibaoduanBarcodeTable)
        .where(
          sql.and(
            sql.eq(schema.jtvGuangzhoujibaoduanBarcodeTable.isUploaded, false),
            sql.between(
              schema.jtvGuangzhoujibaoduanBarcodeTable.date,
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

  resolveFetchURL(dh: string) {
    const store = this.state;
    const url = new URL(
      "/TrainEquipOverhaul/api/hmiseqapi.do",
      `http://${store.get_ip}:${store.get_port}`,
    );

    url.searchParams.set("method", "getData");
    url.searchParams.set("param", [dh, store.unitCode].join(","));

    return url;
  }

  async fetchAxleInfoByDH(dh: string) {
    const url = this.resolveFetchURL(dh);

    url.searchParams.set("type", "csbts");
    void this.logger.log({ title: `请求单号数据:`, message: url.href });

    const res = await net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw new Error(`接口异常[${res.status}]:${res.statusText}`);
    }

    const data: DH_Response = await res.json();
    void this.logger.log({
      title: `返回单号数据:`,
      json: JSON.stringify(data),
    });

    if (data.code !== "200") {
      throw new Error(data.msg);
    }

    return data;
  }

  createPostItem(
    eq_ip: string,
    eq_bh: string,
    record: schema.JTVGuangzhoubeiBarcode,
    detection: Detection,
    detectionData?: DetectionData,
  ) {
    const store = this.state;
    const user = detection.szUsername || "";
    const signature_prefix = store.signature_prefix;
    const signature = signature_prefix + user;

    return {
      eq_ip,
      eq_bh,
      dh: record.barCode || "",
      zh: record.zh || "",
      zx: detection.szWHModel || "",
      TSFF: "超声波",
      TSSJ: tmnowToTSSJ(detection.tmnow || ""),
      TFLAW_PLACE: detectionData ? detectionDataToTPlace(detectionData) : "",
      TFLAW_TYPE: detectionData ? "裂纹" : "",
      TVIEW: detectionData ? "人工复探" : "",
      CZCTZ: signature,
      CZCTY: signature,
      LZXRBZ: signature,
      LZXRBY: signature,
      XHCZ: detection.bWheelLS ? signature : "",
      XHCY: detection.bWheelRS ? signature : "",
      TSZ: signature,
      TSZY: signature,
      CT_RESULT: detection.szResult || "",
    };
  }

  async createPostBody(record: schema.JTVGuangzhoubeiBarcode) {
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

    const corporation = await this.mdb.app().corporation();
    const eq_bh = corporation.DeviceNO || "";
    const eq_ip = getIP();
    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();

    const detections = await this.mdb
      .root()
      .detections()
      .equal("szIDsWheel", record.zh)
      .equal("szIDsMake", record.CZZZDW)
      .equal("szTMMake", record.CZZZRQ)
      .date("tmnow", new Date(startDate), new Date(endDate));

    const detection = atFirstOrThrow(
      detections.rows,
      () => new Error(`记录#${id}对应的检测数据不存在`),
    );
    let detectionDatas: DetectionData[] = [];

    switch (detection.szResult) {
      case "故障":
      case "有故障":
      case "疑似故障":
        detectionDatas = await this.mdb
          .root()
          .detections_data()
          .equal("opid", detection.szIDs)
          .then((r) => r.rows);
        break;
      default:
    }

    if (detectionDatas.length === 0) {
      return [this.createPostItem(eq_ip, eq_bh, record, detection)];
    }

    return detectionDatas.map((detectionData) => {
      return this.createPostItem(
        eq_ip,
        eq_bh,
        record,
        detection,
        detectionData,
      );
    });
  }

  async sendDataToServer(request: PostItem[]) {
    const store = this.state;
    const body = JSON.stringify(request);
    const url = new URL(
      "/TrainEquipOverhaul/api/hmiseqapi.do",
      `http://${store.post_ip}:${store.post_port}`,
    );

    url.searchParams.set("method", "saveData");
    url.searchParams.set("type", "csbts");
    void this.logger.log({ title: `请求数据:`, message: url.href, json: body });

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
    void this.logger.log({ title: `返回数据:`, json: JSON.stringify(data) });

    return data;
  }

  async handleFetch(barcode: string) {
    const data = await this.fetchAxleInfoByDH(barcode);
    const result = normalizeDHResponse(data);

    return result;
  }
  async handleUpload(id: number) {
    const [record] = await this.db
      .select()
      .from(schema.jtvGuangzhoujibaoduanBarcodeTable)
      .where(sql.eq(schema.jtvGuangzhoujibaoduanBarcodeTable.id, id));

    if (!record) {
      throw new Error(`记录#${id}不存在`);
    }

    const body = await this.createPostBody(record);
    await this.sendDataToServer(body);

    const result = await this.db
      .update(schema.jtvGuangzhoujibaoduanBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.jtvGuangzhoujibaoduanBarcodeTable.id, record.id))
      .returning();

    emit();

    return result;
  }
  async handleRecordRead(params: SQLiteGetParams) {
    const rows = await this.db
      .select()
      .from(schema.jtvGuangzhoujibaoduanBarcodeTable)
      .where(
        sql.between(
          schema.jtvGuangzhoujibaoduanBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .offset(params.pageIndex * params.pageSize)
      .limit(params.pageSize)
      .orderBy();

    const [{ count }] = await this.db
      .select({ count: sql.count() })
      .from(schema.jtvGuangzhoujibaoduanBarcodeTable)
      .where(
        sql.between(
          schema.jtvGuangzhoujibaoduanBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .limit(1);

    return { rows, count };
  }
  async handleRecordDelete(id: number) {
    const result = await this.db
      .delete(schema.jtvGuangzhoujibaoduanBarcodeTable)
      .where(sql.eq(schema.jtvGuangzhoujibaoduanBarcodeTable.id, id))
      .returning();

    return result;
  }
  async handleRecordInsert(params: InsertRecordParams) {
    const result = await this.db
      .insert(schema.jtvGuangzhoujibaoduanBarcodeTable)
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
}
