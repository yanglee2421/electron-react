import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { ImageModule } from "./image";

export const registerIPCHandlers = (imageModule: ImageModule) => {
  ipcHandle("MD5/MD5_BACKUP_IMAGE", (_, payload: string) => {
    return imageModule.handleImageBackup(payload);
  });
  ipcHandle("MD5/MD5_COMPUTE", (_, payload: string) => {
    return imageModule.computeMD5([payload]);
  });

  return () => {
    ipcRemoveHandle("MD5/MD5_BACKUP_IMAGE");
    ipcRemoveHandle("MD5/MD5_COMPUTE");
  };
};
