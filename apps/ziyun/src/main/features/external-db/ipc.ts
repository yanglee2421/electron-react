import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import type { ExternalDB } from "./external-db";

export const registerIPCHandlers = (db: ExternalDB) => {
  ipcHandle("external-db/anniversary", () => db.anniversary());
  ipcHandle("external-db/anniversary-detail", (_, id) =>
    db.anniversaryDetail(id),
  );
  ipcHandle("external-db/503", (_, id) => db.fetch503Data(id));
  ipcHandle("external-db/501", (_, id) => db.fetch501Data(id));

  return () => {
    ipcRemoveHandle("external-db/anniversary");
    ipcRemoveHandle("external-db/anniversary-detail");
    ipcRemoveHandle("external-db/503");
  };
};