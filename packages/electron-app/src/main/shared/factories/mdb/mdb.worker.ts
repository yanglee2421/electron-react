import dayjs from "dayjs";
import type { Value } from "mdb-reader";
import MDBReader from "mdb-reader";
import fs from "node:fs";
import type {
  FilterDateValue,
  FilterInValues,
  FilterValue,
  TableQueryResult,
} from "./mdb.types";

const fixMDBDate = (value: Date) => {
  return dayjs(value).add(value.getTimezoneOffset(), "minute").toDate();
};

const clamp = (num: number, min: number, max: number) => {
  return Math.max(min, Math.min(num, max));
};

const isClamped = (num: number, min: number, max: number) => {
  return Object.is(clamp(num, min, max), num);
};

interface GetDataFromMDBOptions {
  databasePath: string;
  tableName: string;
  offset: number;
  limit: number;
  likes: FilterValue[];
  equals: FilterValue[];
  ins: FilterInValues[];
  dates: FilterDateValue[];
}

interface Row {
  [key: string]: Value;
}

const getDataFromMDB = async (
  options: GetDataFromMDBOptions,
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
  const filteredRows = rows.filter((row) => {
    const isLikeMatch = likes.every((filter) => {
      const fieldValue = Reflect.get(row, String(filter.key));

      // 如果字段值不存在，则认为不进行过滤，直接匹配成功
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

      // 如果字段值不存在，则认为不进行过滤，直接匹配成功
      if (!(fieldValue instanceof Date)) {
        return true;
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

export default getDataFromMDB;
