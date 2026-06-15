import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { ExternalDB } from "./external-db";

export const registerIPCHandlers = (db: ExternalDB) => {
  void db;
  ipcHandle("external-db/test", () => {
    return db.test();
  });
  ipcHandle("external-db/anniversary", () => {
    return db.anniversary();
  });
  ipcHandle("external-db/anniversary-detail", (_, id) => {
    return db.anniversaryDetail(id);
  });
  ipcHandle("external-db/503", (_, id) => {
    return db.fetch503Data(id);
  });

  return () => {
    ipcRemoveHandle("external-db/test");
    ipcRemoveHandle("external-db/anniversary");
    ipcRemoveHandle("external-db/anniversary-detail");
    ipcRemoveHandle("external-db/503");
  };
};
