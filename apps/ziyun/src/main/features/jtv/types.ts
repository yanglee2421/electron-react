import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import type { JTV } from "./jtv";

export interface JTVNormalizeResponse {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZDW: string;
  CZZZRQ: string;
  MCZZDW: string;
  MCZZRQ: string;
  SCZZDW: string;
  SCZZRQ: string;
}

export interface IPCContract {
  "HMIS/jtv_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<JTV["handleReadRecord"]>;
  };
  "HMIS/jtv_hmis_sqlite_delete": {
    args: [number];
    return: ReturnType<JTV["handleDeleteRecord"]>;
  };
  "HMIS/jtv_hmis_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<JTV["handleInsertRecord"]>;
  };
  "HMIS/jtv_hmis_api_get": {
    args: [string, boolean?];
    return: ReturnType<JTV["handleFetch"]>;
  };
  "HMIS/jtv_hmis_api_set": {
    args: [number];
    return: ReturnType<JTV["handleUpload"]>;
  };
}
