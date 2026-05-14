import dayjs from "dayjs";
import type { Value } from "mdb-reader";
import MDBReader from "mdb-reader";
import fs from "node:fs";
import type {
  DateFilter,
  EqualFilter,
  Filter,
  FilterDateValue,
  FilterInValues,
  FilterValue,
  InFilter,
  LikeFilter,
  MDBWorkerData,
  Quartor,
  TableQueryResult,
} from "./types";

const fixMDBDate = (value: Date) => {
  return dayjs(value).add(value.getTimezoneOffset(), "minute").toDate();
};

const clamp = (num: number, min: number, max: number) => {
  return Math.max(min, Math.min(num, max));
};

const isClamped = (num: number, min: number, max: number) => {
  return Object.is(clamp(num, min, max), num);
};

interface ResolveQueryBuilderOptions {
  databasePath: string;
  tableName: string;
  offset: number;
  limit: number;
  likes: FilterValue[];
  equals: FilterValue[];
  ins: FilterInValues[];
  dates: FilterDateValue[];
  orderBy?: string;
  orderByDirection?: "asc" | "desc";
}

interface Row {
  [key: string]: Value;
}

const resolveQueryBuilder = async (
  options: ResolveQueryBuilderOptions,
): Promise<TableQueryResult<Row>> => {
  const { databasePath, tableName, offset, limit, equals, likes, ins, dates } =
    options;
  const buffer = await fs.promises.readFile(databasePath);
  const reader = new MDBReader(buffer, { password: "Joney" });
  const tableNames = reader.getTableNames();
  const isTableExist = tableNames.includes(tableName);

  if (!isTableExist) {
    throw new Error(`Table ${tableName} does not exist in the database.`);
  }

  const table = reader.getTable(tableName);
  const rows = table.getData();
  const filteredRows = rows
    .toSorted((a, b) => {
      const orderBy = options.orderBy;

      if (!orderBy) {
        return 0;
      }

      const orderByDirection = options.orderByDirection || "asc";
      const aValue = Reflect.get(a, orderBy);
      const bValue = Reflect.get(b, orderBy);

      switch (orderByDirection) {
        case "asc":
          return valueToNumber(aValue) - valueToNumber(bValue);
        case "desc":
          return valueToNumber(bValue) - valueToNumber(aValue);
        default:
          return 0;
      }
    })
    .filter((row) => {
      const isLikeMatch = likes.every((filter) => {
        const fieldValue = Reflect.get(row, String(filter.key));

        if (!fieldValue) {
          return true;
        }

        return String(fieldValue)
          .toLowerCase()
          .includes(String(filter.value).toLowerCase());
      });

      const isEqualMatch = equals.every((filter) => {
        const fieldValue = Reflect.get(row, String(filter.key));

        return Object.is(fieldValue, filter.value);
      });

      const isInMatch = ins.every((filter) => {
        const fieldValue = Reflect.get(row, String(filter.key));

        return filter.values.includes(fieldValue);
      });

      const isDateMatch = dates.every((filter) => {
        const fieldValue = Reflect.get(row, String(filter.key));

        if (!(fieldValue instanceof Date)) {
          return false;
        }

        const startTime = filter.startAt.getTime();
        const endTime = filter.endAt.getTime();
        const fieldTime = fieldValue.getTime();

        return isClamped(fieldTime, startTime, endTime);
      });

      return isLikeMatch && isEqualMatch && isInMatch && isDateMatch;
    });
  const filteredCount = filteredRows.length;
  const pagedData = filteredRows.slice(offset, offset + limit);
  const resultRows = pagedData.map((row) => {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        return [key, value instanceof Date ? fixMDBDate(value) : value];
      }),
    );
  });

  return { rows: resultRows, count: filteredCount };
};

export default resolveQueryBuilder;

const pagination = <TRow>(
  list: TRow[],
  pageIndex: number,
  pageSize?: number,
) => {
  if (!pageSize) {
    return list;
  }

  const rowOffset = pageIndex * pageSize;

  return list.slice(rowOffset, rowOffset + pageSize);
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

export const getDataFromMDB = async (data: MDBWorkerData) => {
  const { databasePath, tableName, filters, pageSize, pageIndex = 0 } = data;
  const buf = await fs.promises.readFile(databasePath);
  const mdbReader = new MDBReader(buf, { password: "Joney" });
  const allRows = getDataFromTable(mdbReader, tableName, filters);
  const total = allRows.length;

  const rows = allRows.reverse().map((row) => {
    const keyValuePair = Object.entries(row).map(([key, value]) => {
      return [key, value instanceof Date ? fixMDBDate(value) : value] as const;
    });

    const rowData = Object.fromEntries(keyValuePair);

    if (data.with) {
      return {
        ...rowData,
        with: getDataFromTable(mdbReader, `${tableName}_data`, [
          {
            type: "equal",
            field: "opid",
            value: Reflect.get(row, "szIDs")?.toString() || "",
          },
        ]),
      };
    }

    return rowData;
  });

  return {
    total,
    rows: pagination(rows, pageIndex, pageSize),
  };
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
          return Object.is(
            Reflect.get(flaw, "opid"),
            Reflect.get(row, "szIDs"),
          );
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

// string | number | bigint | boolean | Attachment[] | Buffer<ArrayBufferLike> | Date | null

const numberify = (value: Value) => {
  if (typeof value === "undefined") {
    return 0;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const num = Number.parseFloat(value);

    if (Number.isNaN(num)) {
      return 0;
    }

    return num;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "symbol") {
    return 0;
  }

  if (typeof value === "function") {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "object") {
    return 0;
  }

  if (value === null) {
    return 0;
  }

  return 0;
};

const nanToZero = (value: number) => {
  return Number.isNaN(value) ? 0 : value;
};

const valueToNumber = (value: Value) => {
  return nanToZero(numberify(value));
};
