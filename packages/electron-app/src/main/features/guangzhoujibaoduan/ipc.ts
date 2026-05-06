import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { JTV_HMIS_Guangzhoujibaoduan } from "./guangzhoujibaoduan";

export const registerIPCHandlers = (hmis: JTV_HMIS_Guangzhoujibaoduan) => {
  ipcHandle("hmis_guangzhoujibaoduan/get_record", async (_, params) => {
    return hmis.handleRecordRead(params);
  });

  ipcHandle("hmis_guangzhoujibaoduan/delete_record", async (_, id) => {
    return hmis.handleRecordDelete(id);
  });

  ipcHandle("hmis_guangzhoujibaoduan/insert_record", async (_, params) => {
    return hmis.handleRecordInsert(params);
  });

  ipcHandle("hmis_guangzhoujibaoduan/fetch_axle_info", async (_, barcode) => {
    return hmis.handleFetch(barcode);
  });

  ipcHandle("hmis_guangzhoujibaoduan/upload_data", async (_, id) => {
    return hmis.handleUpload(id);
  });

  return () => {
    ipcRemoveHandle("hmis_guangzhoujibaoduan/get_record");
    ipcRemoveHandle("hmis_guangzhoujibaoduan/delete_record");
    ipcRemoveHandle("hmis_guangzhoujibaoduan/insert_record");
    ipcRemoveHandle("hmis_guangzhoujibaoduan/fetch_axle_info");
    ipcRemoveHandle("hmis_guangzhoujibaoduan/upload_data");
  };
};
