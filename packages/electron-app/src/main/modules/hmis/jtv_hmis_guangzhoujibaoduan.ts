// 京天威 广州机保段

import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import { createEmit, getIP } from "#main/lib";
import {
  ipcHandle,
  log,
  type InsertRecordParams,
  type SQLiteGetParams,
} from "#main/lib/ipc";
import type { Detection, DetectionData, MDBDB } from "#main/modules/mdb";
import { KV } from "#main/shared/factories/KV";
import {
  calculateDirection,
  calculatePlace,
} from "#shared/factories/flawDetection";
import { guangzhoujibaoduan } from "#shared/initializer";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import { net } from "electron";
import pLimit from "p-limit";
import { createStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type ZH_Item = {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZRQ: string;
  CZZZDW: string;
  SCZZRQ: string;
  SCZZDW: string;
  MCZZRQ: string;
  MCZZDW: string;

  ZTX?: boolean;
  YTX?: boolean;
};

type ZH_Response = {
  code: string;
  msg: string;
  data: ZH_Item[];
};

type PostItem = {
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
};

type DH_Item = {
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
};

type DH_Response = {
  code: string;
  msg: string;
  data: DH_Item[];
};

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
      ZTX: record.ZTX,
      YTX: record.YTX,
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
      ZTX: record.ZTX,
      YTX: record.YTX,
    };
  });
};

const detectionDataToTPlace = (detectionData: DetectionData) => {
  const direction = calculateDirection(detectionData.nBoard);
  const place = calculatePlace(detectionData.nChannel);

  return direction + place;
};

const tmnowToTSSJ = (tmnow: string) => {
  return dayjs(tmnow).format("YYYY-MM-DD HH:mm:ss");
};

const emit = createEmit("api_set");

type StoreOptionType = ReturnType<typeof guangzhoujibaoduan>;
type StoreType = ReturnType<StoreOptionType["initializer"]>;

const createVanillaStore = (
  kv: KV,
  { storageKey: name, initializer }: StoreOptionType,
) => {
  return createStore<StoreType>()(
    persist(immer(initializer), {
      name: name,
      storage: createJSONStorage(() => kv),
    }),
  );
};

export interface IpcContract {
  "hmis_guangzhoujibaoduan/get_record": {
    args: [SQLiteGetParams];
    return: Awaited<
      ReturnType<typeof JTV_HMIS_Guangzhoujibaoduan.prototype.getRecord>
    >;
  };
  "hmis_guangzhoujibaoduan/delete_record": {
    args: [number];
    return: ReturnType<
      typeof JTV_HMIS_Guangzhoujibaoduan.prototype.deleteRecord
    >;
  };
  "hmis_guangzhoujibaoduan/insert_record": {
    args: [InsertRecordParams];
    return: ReturnType<
      typeof JTV_HMIS_Guangzhoujibaoduan.prototype.insertRecord
    >;
  };
  "hmis_guangzhoujibaoduan/fetch_axle_info": {
    args: [string, boolean?];
    return: ReturnType<
      typeof JTV_HMIS_Guangzhoujibaoduan.prototype.handleFetchAxleInfo
    >;
  };
  "hmis_guangzhoujibaoduan/upload_data": {
    args: [number];
    return: ReturnType<
      typeof JTV_HMIS_Guangzhoujibaoduan.prototype.handleUpload
    >;
  };
}

export class JTV_HMIS_Guangzhoujibaoduan {
  db: SQLiteDBType;
  storeKey: string;
  store: ReturnType<typeof createVanillaStore>;
  mdb: MDBDB;
  autoUploadTimer: NodeJS.Timeout | null = null;

  constructor(db: SQLiteDBType, kv: KV, mdb: MDBDB) {
    const storeOption = guangzhoujibaoduan();
    this.db = db;
    this.storeKey = storeOption.storageKey;
    this.store = createVanillaStore(kv, storeOption);
    this.mdb = mdb;
  }

  async getRecord(params: SQLiteGetParams) {
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

  deleteRecord(id: number) {
    return this.db
      .delete(schema.jtvGuangzhoujibaoduanBarcodeTable)
      .where(sql.eq(schema.jtvGuangzhoujibaoduanBarcodeTable.id, id))
      .returning();
  }

  insertRecord(params: InsertRecordParams) {
    return this.db
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
  }

  resolveFetchURL(dh: string) {
    const store = this.store.getState();
    const url = new URL(`http://${store.get_ip}:${store.get_port}/api/getData`);

    url.searchParams.set("param", [dh, store.unitCode].join(","));

    return url;
  }

  async fetchAxleInfoByDH(dh: string) {
    const url = this.resolveFetchURL(dh);

    url.searchParams.set("type", "csbts");
    log(`请求单号数据:${url.href}`);

    const res = await net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw new Error(`接口异常[${res.status}]:${res.statusText}`);
    }

    const data: DH_Response = await res.json();
    log(`返回单号数据:${JSON.stringify(data)}`);

    if (data.code !== "200") {
      throw new Error(data.msg);
    }

    return data;
  }

  async fetchAxleInfoByZH(zh: string) {
    const url = this.resolveFetchURL(zh);

    url.searchParams.set("type", "csbtszh");
    log(`请求轴号数据:${url.href}`);

    const res = await net.fetch(url.href, { method: "GET" });

    if (!res.ok) {
      throw new Error(`接口异常[${res.status}]:${res.statusText}`);
    }

    const data: ZH_Response = await res.json();
    log(`返回轴号数据:${JSON.stringify(data)}`);

    if (data.code !== "200") {
      throw new Error(data.msg);
    }

    return data;
  }

  async handleFetchAxleInfo(barcode: string, isZhMode?: boolean) {
    if (isZhMode) {
      const data = await this.fetchAxleInfoByZH(barcode);
      const result = normalizeZHResponse(data);

      return result;
    } else {
      const data = await this.fetchAxleInfoByDH(barcode);
      const result = normalizeDHResponse(data);

      return result;
    }
  }

  createPostItem(
    eq_ip: string,
    eq_bh: string,
    record: schema.JTVGuangzhoubeiBarcode,
    detection: Detection,
    detectionData?: DetectionData,
  ) {
    const store = this.store.getState();
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

    const corporation = await this.mdb.getCorporation();
    const eq_bh = corporation.DeviceNO || "";
    const eq_ip = getIP();
    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();

    const detection = await this.mdb.getDetectionForJTV({
      zh: record.zh,
      startDate,
      endDate,
      CZZZDW: record.CZZZDW || "",
      CZZZRQ: record.CZZZRQ || "",
    });

    let detectionDatas: DetectionData[] = [];

    switch (detection.szResult) {
      case "故障":
      case "有故障":
      case "疑似故障":
        detectionDatas = await this.mdb.getDetectionDatasByOPID(
          detection.szIDs,
        );
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

  async uploadData(request: PostItem[]) {
    const store = this.store.getState();
    const url = new URL(
      `http://${store.post_ip}:${store.post_port}/pmss/example.do`,
    );
    const body = JSON.stringify(request);

    url.searchParams.set("method", "saveData");
    url.searchParams.set("type", "csbts");
    log(`请求数据:${url.href},${body}`);

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
    log(`返回数据:${JSON.stringify(data)}`);

    return data;
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
    await this.uploadData(body);

    const [result] = await this.db
      .update(schema.jtvGuangzhoujibaoduanBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.jtvGuangzhoujibaoduanBarcodeTable.id, record.id))
      .returning();

    emit();

    return result;
  }

  startAutoUpload() {
    if (this.autoUploadTimer !== null) {
      return;
    }

    const fn = async () => {
      const limit = pLimit(1);

      try {
        const barcodes = await this.db
          .select()
          .from(schema.jtvGuangzhoujibaoduanBarcodeTable)
          .where(
            sql.and(
              sql.eq(
                schema.jtvGuangzhoujibaoduanBarcodeTable.isUploaded,
                false,
              ),
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
        const store = this.store.getState();
        const delay = store.autoUploadInterval * 1000;
        this.autoUploadTimer = setTimeout(fn, delay);
      }
    };

    fn();
  }

  stopAutoUpload() {
    if (!this.autoUploadTimer) return;
    clearTimeout(this.autoUploadTimer);
    this.autoUploadTimer = null;
  }

  updateStore() {
    this.store.persist.rehydrate();
  }

  initAutoUpload() {
    this.store.subscribe((state) => {
      if (state.autoUpload) {
        this.startAutoUpload();
      } else {
        this.stopAutoUpload();
      }
    });
  }
  bindIPCHandlers() {
    ipcHandle("hmis_guangzhoujibaoduan/get_record", async (_, params) => {
      return this.getRecord(params);
    });

    ipcHandle("hmis_guangzhoujibaoduan/delete_record", async (_, id) => {
      return this.deleteRecord(id);
    });

    ipcHandle("hmis_guangzhoujibaoduan/insert_record", async (_, params) => {
      return this.insertRecord(params);
    });

    ipcHandle(
      "hmis_guangzhoujibaoduan/fetch_axle_info",
      async (_, barcode, isZhMode) => {
        return this.handleFetchAxleInfo(barcode, isZhMode);
      },
    );

    ipcHandle("hmis_guangzhoujibaoduan/upload_data", async (_, id) => {
      return this.handleUpload(id);
    });
  }
}
