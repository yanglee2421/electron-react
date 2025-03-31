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
  szIDsMake: string | null;
  /**
   * @description 轴号
   */
  szIDsWheel: string | null;
  szMemo: string | null;
  szResult: string | null;
  szTMFirst: string | null;
  szTMLast: string | null;
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

export type Corporation = {
  DeviceNO: string | null;
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

export type DatabaseBaseParams = {
  driverPath: string;
  databasePath: string;
};

export type GetDataFromAccessDatabaseParams = DatabaseBaseParams & {
  query: string;
};
