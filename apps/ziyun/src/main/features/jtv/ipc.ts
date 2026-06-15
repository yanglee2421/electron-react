import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { JTV } from "./jtv";

export const registerIPCHandlers = (hmis: JTV) => {
  ipcHandle("HMIS/jtv_hmis_sqlite_get", (_, params) => {
    return hmis.handleReadRecord(params);
  });
  ipcHandle("HMIS/jtv_hmis_sqlite_delete", (_, id) => {
    return hmis.handleDeleteRecord(id);
  });
  ipcHandle("HMIS/jtv_hmis_sqlite_insert", (_, data) => {
    return hmis.handleInsertRecord(data);
  });
  ipcHandle("HMIS/jtv_hmis_api_get", (_, dh, isZhMode) => {
    return hmis.handleFetch(dh, isZhMode);
  });
  ipcHandle("HMIS/jtv_hmis_api_set", (_, id) => {
    return hmis.handleUpload(id);
  });

  return () => {
    ipcRemoveHandle("HMIS/jtv_hmis_sqlite_get");
    ipcRemoveHandle("HMIS/jtv_hmis_sqlite_delete");
    ipcRemoveHandle("HMIS/jtv_hmis_sqlite_insert");
    ipcRemoveHandle("HMIS/jtv_hmis_api_get");
    ipcRemoveHandle("HMIS/jtv_hmis_api_set");
  };
};
