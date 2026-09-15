import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { Fuzhoudong } from "./fuzhoudong";

export const registerIPCHandlers = (hmis: Fuzhoudong) => {
  ipcHandle("HMIS/fuzhoudong_chr501", (_, id) => hmis.handleUploadCHR501(id));
  ipcHandle("HMIS/fuzhoudong_chr502", (_, id) => hmis.handleUploadCHR502(id));
  ipcHandle("HMIS/fuzhoudong_chr503", (_, id) => hmis.handleUploadCHR503(id));

  return () => {
    ipcRemoveHandle("HMIS/fuzhoudong_chr501");
    ipcRemoveHandle("HMIS/fuzhoudong_chr502");
    ipcRemoveHandle("HMIS/fuzhoudong_chr503");
  };
};
