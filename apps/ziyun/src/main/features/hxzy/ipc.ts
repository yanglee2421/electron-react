import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Hxzy } from "./hxzy";

export const registerIPCHandlers = (hmis: Hxzy) => {
  ipcHandle("HMIS/hxzy_hmis_api_get", (_, barcode) => {
    return hmis.handleFetch(barcode);
  });
  ipcHandle("HMIS/hxzy_hmis_api_set", (_, id) => {
    return hmis.handleUpload(id);
  });
  ipcHandle("HMIS/hxzy_hmis_sqlite_get", (_, params) => {
    return hmis.handleRecordRead(params);
  });
  ipcHandle("HMIS/hxzy_hmis_sqlite_delete", (_, id) => {
    return hmis.handleRecordDelete(id);
  });
  ipcHandle("HMIS/hxzy_hmis_sqlite_insert", (_, params) => {
    return hmis.handleRecordInsert(params);
  });

  return () => {
    ipcRemoveHandle("HMIS/hxzy_hmis_api_get");
    ipcRemoveHandle("HMIS/hxzy_hmis_api_set");
    ipcRemoveHandle("HMIS/hxzy_hmis_sqlite_get");
    ipcRemoveHandle("HMIS/hxzy_hmis_sqlite_delete");
    ipcRemoveHandle("HMIS/hxzy_hmis_sqlite_insert");
  };
};
