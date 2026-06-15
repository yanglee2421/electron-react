import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Guangzhoubei } from "./guangzhoubei";

export const registerIPCHandlers = (hmis: Guangzhoubei) => {
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_sqlite_get", (_, params) => {
    return hmis.handleReadRecord(params);
  });
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_sqlite_delete", (_, id) => {
    return hmis.handleDeleteRecord(id);
  });
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_sqlite_insert", (_, data) => {
    return hmis.handleInsertRecord(data);
  });
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_api_get", (_, barcode, isZhMode) => {
    return hmis.handleFetch(barcode, isZhMode);
  });
  ipcHandle("HMIS/jtv_hmis_guangzhoubei_api_set", (_, id) => {
    return hmis.handleUpload(id);
  });

  return () => {
    ipcRemoveHandle("HMIS/jtv_hmis_guangzhoubei_sqlite_get");
    ipcRemoveHandle("HMIS/jtv_hmis_guangzhoubei_sqlite_delete");
    ipcRemoveHandle("HMIS/jtv_hmis_guangzhoubei_sqlite_insert");
    ipcRemoveHandle("HMIS/jtv_hmis_guangzhoubei_api_get");
    ipcRemoveHandle("HMIS/jtv_hmis_guangzhoubei_api_set");
  };
};
