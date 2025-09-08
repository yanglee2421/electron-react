import { ipcMain } from "electron";
import { Worker } from "node:worker_threads";
import { withLog } from "./lib";
import workerPath from "./mdb.worker?modulePath";
import type { MDBWorkerData } from "./mdb.worker";
import { channel } from "./channel";
import { getRootDBPath, getAppDBPath } from "./profile";

export const getDataByWorker = <TRow>(payload: MDBWorkerData) => {
  return new Promise<{
    total: number;
    rows: TRow[];
  }>((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: payload,
    });
    worker.once("message", (data) => {
      resolve(data);
      worker.terminate();
    });
    worker.once("error", (error) => {
      reject(error);
      worker.terminate();
    });
  });
};

export const getDataFromAppDB = async <TRow>(data: Payload) => {
  const appDBPath = await getAppDBPath();
  return getDataByWorker<TRow>({
    ...data,
    databasePath: appDBPath,
  });
};

export const getDataFromRootDB = async <TRow>(data: Payload) => {
  const rootDBPath = await getRootDBPath();
  return getDataByWorker<TRow>({
    ...data,
    databasePath: rootDBPath,
  });
};

export type Payload = Omit<MDBWorkerData, "databasePath">;

export const init = () => {
  ipcMain.handle(
    channel.MDB_ROOT_GET,
    withLog(async (_, data: Payload) => {
      const result = await getDataFromRootDB(data);
      return result;
    }),
  );
  ipcMain.handle(
    channel.MDB_APP_GET,
    withLog(async (_, data: Payload) => {
      const result = await getDataFromAppDB(data);
      return result;
    }),
  );
};
