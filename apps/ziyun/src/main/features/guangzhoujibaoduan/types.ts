import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import type { JTV_HMIS_Guangzhoujibaoduan } from "./guangzhoujibaoduan";

export interface IPCContract {
  "hmis_guangzhoujibaoduan/get_record": {
    args: [SQLiteGetParams];
    return: ReturnType<JTV_HMIS_Guangzhoujibaoduan["handleRecordRead"]>;
  };
  "hmis_guangzhoujibaoduan/delete_record": {
    args: [number];
    return: ReturnType<JTV_HMIS_Guangzhoujibaoduan["handleRecordDelete"]>;
  };
  "hmis_guangzhoujibaoduan/insert_record": {
    args: [InsertRecordParams];
    return: ReturnType<JTV_HMIS_Guangzhoujibaoduan["handleRecordInsert"]>;
  };
  "hmis_guangzhoujibaoduan/fetch_axle_info": {
    args: [string];
    return: ReturnType<JTV_HMIS_Guangzhoujibaoduan["handleFetch"]>;
  };
  "hmis_guangzhoujibaoduan/upload_data": {
    args: [number];
    return: ReturnType<JTV_HMIS_Guangzhoujibaoduan["handleUpload"]>;
  };
}
