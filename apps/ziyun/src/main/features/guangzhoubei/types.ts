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
