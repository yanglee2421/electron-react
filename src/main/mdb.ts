import { ipcMain } from "electron";
import { settings } from "./store";
import { Worker } from "node:worker_threads";
import { withLog } from "./lib";
import workerPath from "./mdb.worker?modulePath";
import type { MDBWorkerData } from "./mdb.worker";

export type Payload = Omit<MDBWorkerData, "databasePath">;

export const init = () => {
  ipcMain.handle(
    "mdb:reader",
    withLog(async (_, data: Payload) => {
      const databasePath = settings.get("databasePath");
      if (!databasePath) {
        throw new Error("Database path is not set");
      }

      if (typeof databasePath !== "string") {
        throw new Error("Database path is not a string");
      }

      const result = await new Promise((resolve) => {
        const worker = new Worker(workerPath, {
          workerData: { ...data, databasePath },
        });
        worker.once("message", (data) => {
          resolve(data);
          worker.terminate();
        });
      });

      return result;
    }),
  );
};
