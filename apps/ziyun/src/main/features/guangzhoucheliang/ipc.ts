import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Guangzhoucheliang } from "./guangzhoucheliang";

export const ipc = (hmis: Guangzhoucheliang) => {
  ipcHandle("guangzhoucheliang/barcode/delete", (_, id) =>
    hmis.handleBarcodeDelete(id),
  );
  ipcHandle("guangzhoucheliang/barcode/insert", (_, payload) => {
    return hmis.handleBarcodeInsert(payload);
  });
  ipcHandle("guangzhoucheliang/barcode/read", (_, payload) => {
    return hmis.handleBarcodeRead(payload);
  });
  ipcHandle("guangzhoucheliang/scanner", (_, payload) => {
    return hmis.handleScanner(payload);
  });
  ipcHandle("guangzhoucheliang/upload", (_, payload) => {
    return hmis.handleUpload(payload);
  });

  return () => {
    ipcRemoveHandle("guangzhoucheliang/barcode/delete");
    ipcRemoveHandle("guangzhoucheliang/barcode/insert");
    ipcRemoveHandle("guangzhoucheliang/barcode/read");
    ipcRemoveHandle("guangzhoucheliang/scanner");
    ipcRemoveHandle("guangzhoucheliang/upload");
  };
};