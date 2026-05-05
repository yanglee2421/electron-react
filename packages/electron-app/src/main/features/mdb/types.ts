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

export interface FilterValue {
  key: unknown;
  value: unknown;
}

export interface FilterInValues {
  key: unknown;
  values: unknown[];
}

export interface FilterDateValue {
  key: unknown;
  startAt: Date;
  endAt: Date;
}

export type TableQueryResult<TRow> = {
  rows: TRow[];
  count: number;
};

export type DatabaseType = "app" | "root";

interface LikeFilter {
  type: "like";
  field: string;
  value: string;
}

interface DateFilter {
  type: "date";
  field: string;
  startAt: string;
  endAt: string;
}

interface InFilter {
  type: "in";
  field: string;
  value: string[];
}

interface EqualFilter {
  type: "equal";
  field: string;
  value: string | number | boolean;
}

export type Filter = LikeFilter | DateFilter | InFilter | EqualFilter;

export interface MDBWorkerData {
  databasePath: string;
  tableName: string;
  pageIndex?: number;
  pageSize?: number;
  filters?: Filter[];
  with?: boolean;
}

export type MDBPayload = Omit<MDBWorkerData, "databasePath">;

export interface IPCContract {
  "MDB/MDB_ROOT_GET": {
    args: [MDBPayload];
    return: { total: number; rows: unknown[] };
  };
  "MDB/MDB_APP_GET": {
    args: [MDBPayload];
    return: { total: number; rows: unknown[] };
  };
}
