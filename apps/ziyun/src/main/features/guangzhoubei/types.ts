import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import type { Guangzhoubei } from "./guangzhoubei";

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
  ZTX: boolean;
  YTX: boolean;
}

export interface IPCContract {
  "HMIS/jtv_hmis_guangzhoubei_api_get": {
    args: [string, boolean?];
    return: ReturnType<Guangzhoubei["handleFetch"]>;
  };
  "HMIS/jtv_hmis_guangzhoubei_api_set": {
    args: [number];
    return: ReturnType<Guangzhoubei["handleUpload"]>;
  };
  "HMIS/jtv_hmis_guangzhoubei_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<Guangzhoubei["handleReadRecord"]>;
  };
  "HMIS/jtv_hmis_guangzhoubei_sqlite_delete": {
    args: [number];
    return: ReturnType<Guangzhoubei["handleDeleteRecord"]>;
  };
  "HMIS/jtv_hmis_guangzhoubei_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<Guangzhoubei["handleInsertRecord"]>;
  };
}

export interface ZH_Item {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZRQ: string;
  CZZZDW: string;
  SCZZRQ: string;
  SCZZDW: string;
  MCZZRQ: string;
  MCZZDW: string;
  ZTX: boolean;
  YTX: boolean;

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

export interface ZH_Response {
  code: string;
  msg: string;
  data: ZH_Item[];
}

export interface PostItem {
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

export interface DH_Item {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZDW: string;
  CZZZRQ: string;
  MCZZDW: string;
  MCZZRQ: string;
  SCZZDW: string;
  SCZZRQ: string;
  ZTX: boolean;
  YTX: boolean;

  SRYY?: string | null;
  SRDW?: string | null;
}

export interface DH_Response {
  code: string;
  msg: string;
  data: DH_Item[];
}
