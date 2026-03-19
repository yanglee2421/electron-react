import dayjs from "dayjs";
import MDBReader from "mdb-reader";
import fs from "node:fs";
import workerThreads from "node:worker_threads";
import type { Quartor } from "./mdb";

export type Filter = LikeFilter | DateFilter | InFilter | EqualFilter;

interface LikeFilter {
  type: "like";
  field: string;
  value: string;
}

interface DateFilter {
  type: "date";
  field: string;
  startAt: string;
  endAt: string;
}

interface InFilter {
  type: "in";
  field: string;
  value: string[];
}

interface EqualFilter {
  type: "equal";
  field: string;
  value: string | number | boolean;
}

export interface MDBWorkerData {
  databasePath: string;
  tableName: string;
  pageIndex?: number;
  pageSize?: number;
  filters?: Filter[];
  with?: boolean;
}

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

  const dateValue = fixMDBDate(fieldValue).getTime();
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
  const allRows = table.getData();

  const filtedRows = allRows.filter((row) => {
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

  return filtedRows;
};

const fixMDBDate = (value: Date) => {
  return dayjs(value).add(value.getTimezoneOffset(), "minute").toDate();
};

export const getDataFromMDB = async (data: MDBWorkerData) => {
  const { databasePath, tableName, filters, pageSize, pageIndex = 0 } = data;
  const buf = await fs.promises.readFile(databasePath);
  const mdbReader = new MDBReader(buf, { password: "Joney" });
  const allRows = getDataFromTable(mdbReader, tableName, filters);
  const total = allRows.length;

  if (!pageSize) {
    return { total, rows: allRows.reverse() };
  }

  const rowOffset = pageIndex * pageSize;
  const rows = allRows
    .reverse()
    .slice(rowOffset, rowOffset + pageSize)
    .map((row) => {
      const keyValuePair = Object.entries(row).map(([key, value]) => {
        return [
          key,
          value instanceof Date ? fixMDBDate(value) : value,
        ] as const;
      });

      return Object.fromEntries(keyValuePair);
    });

  if (!data.with) {
    return { total, rows };
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

  return { total, rows, with: withData };
};

export default getDataFromMDB;

export const bootstrap = async () => {
  const data: MDBWorkerData = workerThreads.workerData;
  const result = await getDataFromMDB(data);

  workerThreads.parentPort?.postMessage(result);
};

interface HandleCHR502Params {
  databasePath: string;
  ids: string[];
}

export const handleCHR502 = async (params: HandleCHR502Params) => {
  const quartors = await getDataFromMDB({
    databasePath: params.databasePath,
    tableName: "quartors",
  });

  const rows = quartors.rows as unknown as Quartor[];
  const flaws = await getDataFromMDB({
    databasePath: params.databasePath,
    tableName: "quartors_data",
  });

  const sortedRows = rows.sort((a, b) => {
    const aTmNow = a.tmnow;
    if (!aTmNow) return 0;
    const bTmNow = b.tmnow;
    if (!bTmNow) return 0;

    return new Date(aTmNow).getTime() - new Date(bTmNow).getTime();
  });

  const selectedRows = sortedRows
    .filter((row) => {
      return params.ids.includes(row.szIDs);
    })
    .map((row) => {
      return {
        ...row,
        with: flaws.rows.filter((flaw) => {
          return flaw.opid === row.szIDs;
        }),
      };
    });

  // selectedRows is already sorted by tmnow because sortedRows is sorted.
  const firstSelectedRow = selectedRows.at(0);

  if (!firstSelectedRow) {
    return {
      previous: null,
      rows: selectedRows,
    };
  }

  const firstSelectedRowIndex = sortedRows.findIndex(
    (row) => row.szIDs === firstSelectedRow.szIDs,
  );
  const previouseInFirstSelectedRowIndex = firstSelectedRowIndex - 1;
  if (previouseInFirstSelectedRowIndex < 0) {
    return {
      previous: null,
      rows: selectedRows,
    };
  }
  const previousInFirstSelectedRow = sortedRows.at(
    previouseInFirstSelectedRowIndex,
  );

  return {
    previous: previousInFirstSelectedRow || null,
    rows: selectedRows,
  };
};
