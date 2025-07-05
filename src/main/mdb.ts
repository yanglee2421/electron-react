import { ipcMain } from "electron";
import { settings } from "./store";
import { Worker } from "node:worker_threads";
import { withLog } from "./lib";
import workerPath from "./mdb.worker?modulePath";

export const init = () => {
  ipcMain.handle(
    "mdb:reader",
    withLog(async () => {
      const databasePath = settings.get("databasePath");
      if (!databasePath) return;

      const rows = await new Promise((resolve) => {
        const worker = new Worker(workerPath, {
          workerData: { databasePath, tableName: "detections" },
        });
        worker.once("message", (data) => {
          resolve(data);
          worker.terminate();
        });
      });

      return rows;
    }),
  );
};
