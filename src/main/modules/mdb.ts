import { ipcHandle } from "#main/lib";
import { channel } from "#main/channel";
import { getRootDBPath, getAppDBPath } from "#main/lib/profile";
import createMDBWorker from "./mdb.worker?nodeWorker";
import type { MDBWorkerData } from "./mdb.worker";

export const getDataByWorker = <TRow>(payload: MDBWorkerData) => {
  return new Promise<{
    total: number;
    rows: TRow[];
  }>((resolve, reject) => {
    const worker = createMDBWorker({
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
  ipcHandle(channel.MDB_ROOT_GET, async (_, data: Payload) => {
    const result = await getDataFromRootDB(data);
    return result;
  });
  ipcHandle(channel.MDB_APP_GET, async (_, data: Payload) => {
    const result = await getDataFromAppDB(data);
    return result;
  });
};
