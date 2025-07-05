import MDBReader from "mdb-reader";
import { parentPort, workerData } from "node:worker_threads";
import fs from "node:fs/promises";

const tableName = workerData.tableName;
const databasePath = workerData.databasePath;
const pageIndex = workerData.pageIndex || 0;
const pageSize = workerData.pageSize || 20;

const buf = await fs.readFile(databasePath);
const mdbReader = new MDBReader(buf, {
  password: "Joney",
});
const table = mdbReader.getTable(tableName);
const result = table
  .getData()
  .reverse()
  .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

parentPort?.postMessage(result);
