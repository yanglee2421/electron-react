import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { ExternalDB } from "./external-db";

export const registerIPCHandlers = (db: ExternalDB) => {
  void db;
  ipcHandle("external-db/test", () => {
    return db.test();
  });

  return () => {
    ipcRemoveHandle("external-db/test");
  };
};
