import type {
  FilterDateValue,
  FilterInValues,
  FilterValue,
  TableQueryResult,
} from "#main/features/mdb/types";
import dayjs from "dayjs";
import type { Value } from "mdb-reader";
import MDBReader from "mdb-reader";
import fs from "node:fs";

const fixMDBDate = (value: Date) => {
  return dayjs(value).add(value.getTimezoneOffset(), "minute").toDate();
};

const clamp = (num: number, min: number, max: number) => {
  return Math.max(min, Math.min(num, max));
};

const isClamped = (num: number, min: number, max: number) => {
  return Object.is(clamp(num, min, max), num);
};

const lt = (row: Row, ltKey?: unknown, ltValue?: number) => {
  if (typeof ltKey !== "string") {
    return true;
  }

  if (typeof ltValue !== "number") {
    return true;
  }

  const fieldValue = Reflect.get(row, ltKey);
  const numValue = valueToNumber(fieldValue);

  return numValue < ltValue;
};

const gt = (row: Row, gtKey?: unknown, gtValue?: number) => {
  if (typeof gtKey !== "string") {
    return true;
  }

  if (typeof gtValue !== "number") {
    return true;
  }

  const fieldValue = Reflect.get(row, gtKey);
  const numValue = valueToNumber(fieldValue);

  return numValue > gtValue;
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
  ltKey?: unknown;
  ltValue?: number;
  gtKey?: unknown;
  gtValue?: number;
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
    .map((row) => {
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
          return [key, value instanceof Date ? fixMDBDate(value) : value];
        }),
      );
    })
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

      const isLtMatch = lt(row, options.ltKey, options.ltValue);
      const isGtMatch = gt(row, options.gtKey, options.gtValue);

      return (
        isLikeMatch &&
        isEqualMatch &&
        isInMatch &&
        isDateMatch &&
        isLtMatch &&
        isGtMatch
      );
    });
  const filteredCount = filteredRows.length;
  const pagedData = filteredRows.slice(offset, offset + limit);

  return { rows: pagedData, count: filteredCount };
};

export default resolveQueryBuilder;

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
