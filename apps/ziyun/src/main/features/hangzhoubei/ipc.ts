import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Hangzhoubei } from "./hangzhoubei";

export const registerIPCHandlers = (hmis: Hangzhoubei) => {
  ipcHandle("HMIS/hangzhoubei_chr501", (_, id) => hmis.handleUploadCHR501(id));
  ipcHandle("HMIS/hangzhoubei_chr502", (_, id) => hmis.handleUploadCHR502(id));
  ipcHandle("HMIS/hangzhoubei_chr503", (_, id) => hmis.handleUploadCHR503(id));

  return () => {
    ipcRemoveHandle("HMIS/hangzhoubei_chr501");
    ipcRemoveHandle("HMIS/hangzhoubei_chr502");
    ipcRemoveHandle("HMIS/hangzhoubei_chr503");
  };
};
