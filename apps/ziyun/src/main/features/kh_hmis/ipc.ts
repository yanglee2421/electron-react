import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { KH } from "./kh_hmis";

export const registerIPCHandlers = (hmis: KH) => {
  ipcHandle("HMIS/kh_hmis_sqlite_get", (_, params) => {
    return hmis.handleReadRecord(params);
  });
  ipcHandle("HMIS/kh_hmis_sqlite_delete", (_, id) => {
    return hmis.handleDeleteRecord(id);
  });
  ipcHandle("HMIS/kh_hmis_sqlite_insert", (_, params) => {
    return hmis.handleInsertRecord(params);
  });
  ipcHandle("HMIS/kh_hmis_api_get", (_, barcode) => hmis.handleFetch(barcode));
  ipcHandle("HMIS/kh_hmis_api_set", (_, id) => hmis.handleUpload(id));
  ipcHandle("HMIS/kh_hmis_chr501", (_, id) => hmis.handleUploadCHR501(id));
  ipcHandle("HMIS/kh_hmis_chr502", (_, id) => hmis.handleUploadCHR502(id));
  ipcHandle("HMIS/kh_hmis_chr503", (_, id) => hmis.handleUploadCHR503(id));
  ipcHandle("HMIS/kh_hmis_chr52a", (_, id) => hmis.handleUploadCHR52A(id));

  return () => {
    ipcRemoveHandle("HMIS/kh_hmis_sqlite_get");
    ipcRemoveHandle("HMIS/kh_hmis_sqlite_delete");
    ipcRemoveHandle("HMIS/kh_hmis_sqlite_insert");
    ipcRemoveHandle("HMIS/kh_hmis_api_get");
    ipcRemoveHandle("HMIS/kh_hmis_api_set");
    ipcRemoveHandle("HMIS/kh_hmis_chr501");
    ipcRemoveHandle("HMIS/kh_hmis_chr502");
    ipcRemoveHandle("HMIS/kh_hmis_chr503");
    ipcRemoveHandle("HMIS/kh_hmis_chr52a");
  };
};
