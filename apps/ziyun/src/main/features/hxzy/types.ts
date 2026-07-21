import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import type { Hxzy } from "./hxzy";

export interface HxzyGetResponse {
  code: "200";
  msg: "数据读取成功";
  data: [
    {
      CZZZDW: "048";
      CZZZRQ: "2009-10";
      MCZZDW: "131";
      MCZZRQ: "2018-07-09 00:00:00";
      SCZZDW: "131";
      SCZZRQ: "2018-07-09 00:00:00";
      DH: "91022070168";
      ZH: "67444";
      ZX: "RE2B";
      SRYY: "厂修";
      SRDW: "588";
    },
  ];
}

export interface PostRequestItem {
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

export interface PostResponse {
  code: string;
  msg: "数据上传成功";
}

export interface Upload501Response {
  code: string;
  msg: string;
}

export interface IPCContract {
  "HMIS/hxzy_hmis_api_get": {
    args: [string];
    return: ReturnType<Hxzy["handleFetch"]>;
  };
  "HMIS/hxzy_hmis_api_set": {
    args: [number];
    return: ReturnType<Hxzy["handleUpload"]>;
  };
  "HMIS/hxzy_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<Hxzy["handleRecordRead"]>;
  };
  "HMIS/hxzy_hmis_sqlite_delete": {
    args: [number];
    return: ReturnType<Hxzy["handleRecordDelete"]>;
  };
  "HMIS/hxzy_hmis_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<Hxzy["handleRecordInsert"]>;
  };
  "hmis/hxzy_upload_501": {
    args: [string];
    return: ReturnType<Hxzy["upload501"]>;
  };
}