import MDBReader from "mdb-reader";
import { parentPort, workerData as _workerData } from "node:worker_threads";
import fs from "node:fs/promises";

type Filter = LikeFilter | DateFilter | InFilter;

type LikeFilter = {
  type: "like";
  field: string;
  value: string;
};

type DateFilter = {
  type: "date";
  field: string;
  value: string;
  startAt: string;
  endAt: string;
};

type InFilter = {
  type: "in";
  field: string;
  value: string[];
};

export type MDBWorkerData = {
  databasePath: string;
  tableName: string;
  pageIndex?: number;
  pageSize?: number;
  filters?: Filter[];
};

const workerData: MDBWorkerData = _workerData;

const tableName = workerData.tableName;
const databasePath = workerData.databasePath;
const pageIndex = workerData.pageIndex || 0;
const pageSize = workerData.pageSize || 20;

const likeFn = (row: NonNullable<unknown>, filter: LikeFilter) => {
  const fieldValue = Reflect.get(row, filter.field);
  if (!filter.value) return true;
  if (typeof fieldValue !== "string") {
    return false;
  }

  return fieldValue.toLowerCase().includes(filter.value.toLowerCase());
};

const dateFn = (row: NonNullable<unknown>, filter: DateFilter) => {
  const fieldValue = Reflect.get(row, filter.field);
  if (typeof fieldValue !== "string") {
    return false;
  }
  const dateValue = new Date(fieldValue).getTime();
  const startAt = new Date(filter.startAt).getTime();
  const endAt = new Date(filter.endAt).getTime();
  return Object.is(Math.max(Math.min(dateValue, endAt), startAt), dateValue);
};

const buf = await fs.readFile(databasePath);
const mdbReader = new MDBReader(buf, {
  password: "Joney",
});
const table = mdbReader.getTable(tableName);
const allRows = table.getData().filter((row) => {
  if (!Array.isArray(workerData.filters)) return true;
  if (!workerData.filters.length) return true;

  return workerData.filters.every((filter) => {
    switch (filter.type) {
      case "like":
        return likeFn(row, filter);
      case "date":
        return dateFn(row, filter);
      default:
        return true;
    }
  });
});

const total = allRows.length;
const rowOffset = pageIndex * pageSize;
const rows = allRows.reverse().slice(rowOffset, rowOffset + pageSize);

parentPort?.postMessage({ total, rows });
