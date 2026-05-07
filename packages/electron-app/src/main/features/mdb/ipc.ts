import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { MDB } from "./mdb";

export const registerIPCHandlers = (mdb: MDB) => {
  ipcHandle("MDB/MDB_ROOT_GET", async (_, data) => {
    return mdb.getDataFromRootDB(data);
  });
  ipcHandle("MDB/MDB_APP_GET", async (_, data) => {
    return mdb.getDataFromAppDB(data);
  });

  return () => {
    ipcRemoveHandle("MDB/MDB_ROOT_GET");
    ipcRemoveHandle("MDB/MDB_APP_GET");
  };
};
