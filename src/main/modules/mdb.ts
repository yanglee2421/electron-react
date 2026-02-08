import dayjs from "dayjs";
import { ipcHandle } from "#main/lib/ipc";
import createMDBWorker from "./mdb.worker?nodeWorker";
import type { MDBWorkerData } from "./mdb.worker";
import type { ProfileStore } from "#main/lib/profile";

export type Detection = {
  bFlaws: boolean | null;
  bSickLD: boolean | null;
  bSickRD: boolean | null;
  bWheelLS: boolean | null;
  bWheelRS: boolean | null;
  ftRadiu: number | null;
  szIDs: string;
  szIDsFirst: string | null;
  szIDsLast: string | null;
  /**
   * @description 车轴制造单位
   */
  szIDsMake: string | null;
  /**
   * @description 轴号
   */
  szIDsWheel: string | null;
  szMemo: string | null;
  szResult: string | null;
  szTMFirst: string | null;
  szTMLast: string | null;
  /**
   * @description 车轴制造时间
   */
  szTMMake: string | null;
  szUsername: string | null;
  /**
   * @description 轴型
   */
  szWHModel: string | null;
  tmnow: string | null;
};

export type DetectionData = {
  ManualRes: string | null;
  bEnable: boolean;
  fltValueUS: number;
  fltValueUSH: number;
  fltValueX: number;
  fltValueY: number;
  nAtten: number;
  nBoard: number;
  nChannel: number;
  nFWCount: number;
  nFWIn: number;
  nFWIndex: number;
  nFWOut: number;
  nTAIndex: number;
  opid: string | null;
};

export type Verify = {
  bFlaws: boolean;
  bSickLD: boolean;
  bSickRD: boolean;
  bWheelLS: boolean;
  bWheelRS: boolean;
  ftRadiu: number;
  szIDs: string;
  szIDsFirst: string | null;
  szIDsLast: string | null;
  szIDsMake: string | null;
  szIDsWheel: string | null;
  szMemo: string | null;
  szResult: string | null;
  szTMFirst: string | null;
  szTMLast: string | null;
  szTMMake: string | null;
  szUsername: string | null;
  szWHModel: string | null;
  tmNow: string | null;
};

export type VerifyData = {
  ManualRes: string | null;
  bEnable: boolean;
  fltValueUS: number;
  fltValueUSH: number;
  fltValueX: number;
  fltValueY: number;
  nAtten: number;
  nBoard: number;
  nChannel: number;
  nFWCount: number;
  nFWIn: number;
  nFWIndex: number;
  nFWOut: number;
  nTAIndex: number;
  opid: string | null;
};

export type Quartor = {
  szIDs: string;
  szIDsWheel: string | null;
  szWHModel: string | null;
  szUsername: string | null;
  szIDsMake: string | null;
  szIDsFirst: string | null;
  szIDsLast: string | null;
  szTMMake: string | null;
  szTMFirst: string | null;
  szTMLast: string | null;
  ftRadiu: number | null;
  bFlaws: boolean | null;
  bWheelLS: boolean | null;
  bWheelRS: boolean | null;
  bSickLD: boolean | null;
  bSickRD: boolean | null;
  tmnow: string | null;
  szResult: string | null;
  szMemo: string | null;
  DB: string | null;
  bJiXiaoReportOut: boolean | null;
  bHeGe: boolean | null;
  startTime: string | null;
  endTime: string | null;
};

export type QuartorData = {
  opid: string | null;
  nBoard: number;
  nChannel: number;
  nTAIndex: number;
  nAtten: number;
  nFWIndex: number;
  nFWIn: number;
  nFWOut: number;
  nFWCount: number;
  fltValueX: number;
  fltValueY: number;
  fltValueUS: number;
  fltValueUSH: number;
  bEnable: boolean;
  ManualRes: string | null;
};

export type Corporation = {
  DeviceNO: string | null;
};

type GetDetectionForJTVParams = {
  zh: string;
  startDate: string;
  endDate: string;
  CZZZDW: string;
  CZZZRQ: string;
};

export type MDBPayload = Omit<MDBWorkerData, "databasePath">;

export class MDBDB {
  #profile: ProfileStore;
  constructor(profile: ProfileStore) {
    this.#profile = profile;
  }

  getDataByWorker<TRow>(payload: MDBWorkerData) {
    return new Promise<{
      total: number;
      rows: TRow[];
    }>((resolve, reject) => {
      const worker = createMDBWorker({
        workerData: payload,
      });
      worker.once("message", (data) => {
        resolve(data);
        worker.terminate();
      });
      worker.once("error", (error) => {
        reject(error);
        worker.terminate();
      });
    });
  }
  async getDataFromAppDB<TRow>(data: MDBPayload) {
    const databasePath = await this.#profile.getAppDBPath();

    return this.getDataByWorker<TRow>({
      ...data,
      databasePath,
    });
  }
  async getDataFromRootDB<TRow>(data: MDBPayload) {
    const databasePath = await this.#profile.getRootDBPath();

    return this.getDataByWorker<TRow>({
      ...data,
      databasePath,
    });
  }
  async getDetectionByZH(params: {
    zh: string;
    startDate: string;
    endDate: string;
  }) {
    const startDate = dayjs(params.startDate).toISOString();
    const endDate = dayjs(params.endDate).toISOString();

    const {
      rows: [detection],
    } = await this.getDataFromRootDB<Detection>({
      tableName: "detections",
      filters: [
        {
          type: "equal",
          field: "szIDsWheel",
          value: params.zh,
        },
        {
          type: "date",
          field: "tmnow",
          startAt: startDate,
          endAt: endDate,
        },
      ],
    });

    if (!detection) {
      throw new Error(`未找到轴号[${params.zh}]的detections记录`);
    }

    return detection;
  }
  async getDetectionDatasByOPID(opid: string) {
    const detectionDatas = await this.getDataFromRootDB<DetectionData>({
      tableName: "detections_data",
      filters: [
        {
          type: "equal",
          field: "opid",
          value: opid,
        },
      ],
    });

    return detectionDatas.rows;
  }
  async getDetectionForJTV(params: GetDetectionForJTVParams) {
    const startDate = dayjs(params.startDate).toISOString();
    const endDate = dayjs(params.endDate).toISOString();

    const {
      rows: [detection],
    } = await this.getDataFromRootDB<Detection>({
      tableName: "detections",
      filters: [
        {
          type: "equal",
          field: "szIDsWheel",
          value: params.zh,
        },
        {
          type: "equal",
          field: "szIDsMake",
          value: dayjs(params.CZZZDW).format("YYYYMM"),
        },
        {
          type: "equal",
          field: "szTMMake",
          value: dayjs(params.CZZZRQ).format("YYYYMM"),
        },
        {
          type: "date",
          field: "tmnow",
          startAt: startDate,
          endAt: endDate,
        },
      ],
    });

    if (!detection) {
      throw new Error(`未找到轴号[${params.zh}]的detections记录`);
    }

    return detection;
  }
  async getCorporation() {
    const {
      rows: [corporation],
    } = await this.getDataFromAppDB<Corporation>({
      tableName: "corporation",
    });

    if (!corporation) {
      throw new Error("未找到公司信息");
    }

    return corporation;
  }

  bindIpcHandlers() {
    ipcHandle("MDB/MDB_ROOT_GET", async (_, data: MDBPayload) => {
      const result = await this.getDataFromRootDB(data);
      return result;
    });
    ipcHandle("MDB/MDB_APP_GET", async (_, data: MDBPayload) => {
      const result = await this.getDataFromAppDB(data);
      return result;
    });
  }
}
