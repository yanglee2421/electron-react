import { type IpcHandle } from "#main/lib/ipc";
import type { Profile } from "#main/shared/factories/Profile";
import dayjs from "dayjs";
import os from "node:os";
import { Piscina } from "piscina";
import type { MDBWorkerData } from "./mdb.worker";
import workerPath from "./mdb.worker?modulePath";

export interface Detecotor {
  id: number;
  nwheel: number;
  nAttenuation: number;
  nSAttenuation: number;
  nRange: number;
  nPulse: number;
  nRes0: number;
  nRes1: number;
  nRes2: number;
  nDelay: number;
  nZSize: number;
  nWAngle: number;
  nManualDB: number;
  nDBSub: number;
  dblDistance: number;
  nBoard: number;
  nChannel: number;
  nTGBoard: number;
  nTGCChannel: number;

  guid: string;
  szName: string;
  szwheel: string;
}

export interface Detection {
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
}

export interface DetectionData {
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
}

export interface Verify {
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
}

export interface VerifyData {
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
}

export interface Quartor {
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
}

export interface QuartorData {
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
}

export interface Corporation {
  DeviceNO: string | null;
  DeviceName: string | null;
  DeviceType: string | null;
  Factory: string | null;
  Workshop: string | null;
  TBType: string | null;
  prodate: string | null;
}

interface GetDetectionForJTVParams {
  zh: string;
  startDate: string;
  endDate: string;
  CZZZDW: string;
  CZZZRQ: string;
}

interface GetDataForCHR502Params {
  ids: string[];
}

type QuartorWithData = Quartor & {
  with: QuartorData[];
};

export interface QuartorYearlyData {
  szIDs: string;
  nBoard: number;
  nChannel: number;
  nDecetoer: number;
  /**
   * @description 最终检测结果（合格/不合格）
   */
  bResult: boolean;
  /**
   * @description 水平线性结果是否合格
   */
  bResultHor: boolean;
  /**
   * @description 垂直线性结果是否合格
   */
  bResultVer: boolean;
  /**
   * @description 分辨力检测结果是否合格
   */
  bResultDec: boolean;
  /**
   * @description 灵敏度余量检测结果是否合格
   */
  bResultAtt: boolean;
  bResultDtyn: boolean;

  Hor_Atten: number;
  Hor_B0: number;
  Hor_B1: number;
  Hor_B2: number;
  Hor_B3: number;
  Hor_B4: number;
  Hor_B5: number;
  Hor_Max: number;
  /**
   * @description 水平线性结果
   */
  Hor_fResult: number;
  // 数字类型（Dec 相关）
  Dec_LAtten: number;
  Dec_HAtten: number;
  /**
   * @description 分辨力检测结果，需要除以10
   */
  Dec_Max: number;
  // 数字类型（Ver 相关 - 原有）
  Ver_B0: number;
  Ver_B1: number;
  Ver_B2: number;
  Ver_B3: number;
  Ver_B4: number;
  Ver_B5: number;
  Ver_B6: number;
  Ver_B7: number;
  Ver_B8: number;
  Ver_B9: number;
  Ver_B10: number;
  Ver_B11: number;
  Ver_B12: number;
  Ver_B13: number;
  Ver_BP: number;
  Ver_BN: number;
  /**
   * @description 垂直线性结果
   */
  Ver_fResult: number;
  // Att 相关数字字段
  Att_S0: number;
  Att_S1: number;
  /**
   * @description 灵敏度余量检测结果，需要除以10
   */
  Att_Max: number;

  // Dyn 相关数字字段（Dyn_Max 备注为S1与S2的差值的绝对值，类型仍为数字）
  Dyn_S1: number;
  Dyn_S2: number;
  Dyn_Max: number;
  // 短文本类型
  szUsername: string;
  // 日期/时间类型：推荐用 string（适配接口传输），也可根据场景改用 Date 类型
  tmNow: string; // 若需直接用日期对象，可改为 Date，如：tmNow: Date;
}

export type MDBPayload = Omit<MDBWorkerData, "databasePath">;

export class MDBDB {
  private profile: Profile;
  private piscina: Piscina;

  constructor(profile: Profile) {
    this.profile = profile;
    this.piscina = new Piscina({
      filename: workerPath,
      minThreads: 1,
      maxThreads: os.cpus().length,
    });
  }

  getDataByWorker<TRow>(payload: MDBWorkerData): Promise<{
    total: number;
    rows: TRow[];
  }> {
    // return new Promise<{
    //   total: number;
    //   rows: TRow[];
    // }>((resolve, reject) => {
    //   const worker = createMDBWorker({
    //     workerData: payload,
    //   });
    //   worker.once("message", (data) => {
    //     resolve(data);
    //     void worker.terminate();
    //   });
    //   worker.once("error", (error) => {
    //     reject(error);
    //     void worker.terminate();
    //   });
    // });

    return this.piscina.run(payload);
  }
  async getDataForCHR502({ ids }: GetDataForCHR502Params): Promise<{
    previous: Quartor | null;
    rows: QuartorWithData[];
  }> {
    const databasePath = await this.profile.getRootDBPath();

    return this.piscina.run({ ids, databasePath }, { name: "handleCHR502" });
  }

  async getDataFromAppDB<TRow>(data: MDBPayload) {
    const databasePath = this.profile.getAppDBPath();

    return this.getDataByWorker<TRow>({
      ...data,
      databasePath,
    });
  }
  async getDataFromRootDB<TRow>(data: MDBPayload) {
    const databasePath = await this.profile.getRootDBPath();

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
          value: params.CZZZDW,
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
  async getYearlyData(id: string) {
    const query = await this.getDataFromRootDB<QuartorYearlyData>({
      tableName: "Quartor",
      filters: [{ type: "equal", field: "szIDs", value: id }],
    });

    return query;
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
  async getDetector(nChannel: number, nBoard: number, szwheel: string) {
    const data = await this.getDataFromAppDB<Detecotor>({
      tableName: "detectors",
      filters: [
        {
          type: "equal",
          field: "nChannel",
          value: nChannel,
        },
        {
          type: "equal",
          field: "nBoard",
          value: nBoard,
        },
        {
          type: "equal",
          field: "szwheel",
          value: szwheel,
        },
      ],
    });

    const [record] = data.rows;

    if (!record) {
      throw new Error(
        `未找到探头[nBoard=${nBoard}, nChannel=${nChannel}, szwheel=${szwheel}]的记录`,
      );
    }

    return record;
  }

  dispose() {
    void this.piscina.destroy();
  }
}

export const bindIpcHandlers = (mdb: MDBDB, ipcHandle: IpcHandle) => {
  ipcHandle("MDB/MDB_ROOT_GET", async (_, data: MDBPayload) => {
    const result = await mdb.getDataFromRootDB(data);
    return result;
  });
  ipcHandle("MDB/MDB_APP_GET", async (_, data: MDBPayload) => {
    const result = await mdb.getDataFromAppDB(data);
    return result;
  });
};
