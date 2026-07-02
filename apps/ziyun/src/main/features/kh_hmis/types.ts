import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import type { KH } from "./kh_hmis";
export type { I501Record } from "./501";
export type { I502Record } from "./502";
export type { I503 } from "./503";
export type { I52a } from "./52a";

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
  "HMIS/kh_hmis_chr52a": {
    args: [string];
    return: ReturnType<KH["handleUploadCHR52A"]>;
  };
}

export interface KHGetResponse {
  data: {
    mesureId: string;
    zh: string;
    zx: string;
    clbjLeft: string;
    clbjRight: string;
    czzzrq: string;
    czzzdw: string;
    ldszrq: string;
    ldszdw: string;
    ldmzrq: string;
    ldmzdw: string;
  };
  code: number;
  msg: string;
}

export interface QXDataParams {
  mesureid: string;
  zh: string;
  testdatetime: string;
  testtype: string;
  btcw: string;
  tsr: string;
  tsgz: string;
  tszjy: string;
  tsysy: string;
  gzmc: string;
  clff: string;
  qxlzzdmjlnc?: string;
  qxlzzdmjlwc?: string;
  qxlzydmjlnc?: string;
  qxlzydmjlwc?: string;
  qxlzzlwcnc?: string;
  qxlzzlwcwc?: string;
  qxlzylwcnc?: string;
  qxlzylwcwc?: string;
  qxlzzlwsnc?: string;
  qxlzzlwswc?: string;
  qxlzylwsnc?: string;
  qxlzylwswc?: string;
  qxzjzdmjlzj?: string;
  qxzjzdmjlzs?: string;
  qxzjydmjlzj?: string;
  qxzjydmjlzs?: string;
  qxzjzlwczj?: string;
  qxzjzlwczs?: string;
  qxzjylwczj?: string;
  qxzjylwczs?: string;
  qxzjzlwszj?: string;
  qxzjzlwszs?: string;
  qxzjylwszj?: string;
  qxzjylwszs?: string;
  qxclzlwcz?: string;
  qxclzlwcy?: string;
  qxclylwcz?: string;
  qxclylwcy?: string;
  bz: string;
}

export interface PostRequestItem {
  mesureId?: string;
  ZH: string;
  ZCTJG: string;
  ZZJJG: string;
  ZLZJG: string;
  YCTJG: string;
  YZJJG: string;
  YLZJG: string;
  JCJG: string;
  BZ?: string;
  TSRY: string;
  JCSJ: string;
  sbbh: string;
}

export interface PostResponse {
  code: number;
  msg: string;
}