import * as fs from "node:fs";
import * as workerThreads from "node:worker_threads";
import MDBReader from "mdb-reader";

export type Filter = LikeFilter | DateFilter | InFilter | EqualFilter;

type LikeFilter = {
  type: "like";
  field: string;
  value: string;
};

type DateFilter = {
  type: "date";
  field: string;
  startAt: string;
  endAt: string;
};

type InFilter = {
  type: "in";
  field: string;
  value: string[];
};

type EqualFilter = {
  type: "equal";
  field: string;
  value: string | number | boolean;
};

export type MDBWorkerData = {
  databasePath: string;
  tableName: string;
  pageIndex?: number;
  pageSize?: number;
  filters?: Filter[];
  with?: boolean;
};

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
  const isDate = fieldValue instanceof Date;

  if (!isDate) {
    return false;
  }

  const dateValue = fieldValue.getTime();
  const startAt = Date.parse(filter.startAt);
  const endAt = Date.parse(filter.endAt);

  return Object.is(Math.max(Math.min(dateValue, endAt), startAt), dateValue);
};

const inFn = (row: NonNullable<unknown>, filter: InFilter) => {
  if (!Array.isArray(filter.value)) {
    return true;
  }

  const fieldValue = Reflect.get(row, filter.field);

  return filter.value.includes(fieldValue);
};

const equalFn = (row: NonNullable<unknown>, filter: EqualFilter) => {
  const fieldValue = Reflect.get(row, filter.field);
  return Object.is(fieldValue, filter.value);
};

const getDataFromTable = (
  reader: MDBReader,
  tableName: string,
  filters?: Filter[],
) => {
  const table = reader.getTable(tableName);
  return table.getData().filter((row) => {
    if (!Array.isArray(filters)) return true;

    return filters.every((filter) => {
      switch (filter.type) {
        case "like":
          return likeFn(row, filter);
        case "date":
          return dateFn(row, filter);
        case "in":
          return inFn(row, filter);
        case "equal":
          return equalFn(row, filter);
        default:
          return true;
      }
    });
  });
};

const bootstrap = async () => {
  const workerData: MDBWorkerData = workerThreads.workerData;
  const tableName = workerData.tableName;
  const databasePath = workerData.databasePath;
  const pageIndex = workerData.pageIndex || 0;
  const pageSize = workerData.pageSize;
  const buf = await fs.promises.readFile(databasePath);
  const mdbReader = new MDBReader(buf, { password: "Joney" });
  const allRows = getDataFromTable(mdbReader, tableName, workerData.filters);
  const total = allRows.length;

  if (!pageSize) {
    workerThreads.parentPort?.postMessage({ total, rows: allRows.reverse() });
    return;
  }

  const rowOffset = pageIndex * pageSize;
  const rows = allRows.reverse().slice(rowOffset, rowOffset + pageSize);

  if (!workerData.with) {
    workerThreads.parentPort?.postMessage({ total, rows });
    return;
  }

  const rowIds = rows
    .map((row) => Reflect.get(row, "szIDs"))
    .filter((id) => typeof id === "string");

  const withData = getDataFromTable(mdbReader, `${tableName}_data`, [
    {
      type: "in",
      field: "opid",
      value: rowIds,
    },
  ]);

  workerThreads.parentPort?.postMessage({
    total,
    rows: rows.map((row) => ({
      ...row,
      with: withData.filter((data) => data.opid === Reflect.get(row, "opid")),
    })),
  });
};

bootstrap();
