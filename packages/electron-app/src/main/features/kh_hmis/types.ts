import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import type { KH } from "./kh_hmis";

export interface IPCContract {
  "HMIS/kh_hmis_api_get": {
    args: [string];
    return: ReturnType<KH["handleFetch"]>;
  };
  "HMIS/kh_hmis_api_set": {
    args: [number];
    return: ReturnType<KH["handleUpload"]>;
  };
  "HMIS/kh_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<KH["handleReadRecord"]>;
  };
  "HMIS/kh_hmis_sqlite_delete": {
    args: [number];
    return: ReturnType<KH["handleDeleteRecord"]>;
  };
  "HMIS/kh_hmis_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<KH["handleInsertRecord"]>;
  };
  "HMIS/kh_hmis_chr501": {
    args: [string];
    return: ReturnType<KH["handleUploadCHR501"]>;
  };
  "HMIS/kh_hmis_chr502": {
    args: [string[]];
    return: ReturnType<KH["handleUploadCHR502"]>;
  };
  "HMIS/kh_hmis_chr503": {
    args: [string];
    return: ReturnType<KH["handleUploadCHR503"]>;
  };
}
