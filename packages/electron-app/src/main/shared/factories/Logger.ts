import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import type { IpcHandle } from "#main/lib/ipc";
import * as sql from "drizzle-orm";

interface LoggerOptions {
  title: string;
  message?: string;
  json?: string;
}

interface ListOptions {
  level?: string;
  startDate: string;
  endDate: string;
  pageIndex: number;
  pageSize: number;
}

export class Logger {
  private db: SQLiteDBType;

  constructor(db: SQLiteDBType) {
    this.db = db;
  }

  error({ title, message, json }: LoggerOptions) {
    this.db.insert(schema.logTable).values({
      level: "error",
      title,
      message,
      json,
    });
  }
  log({ title, message, json }: LoggerOptions) {
    this.db.insert(schema.logTable).values({
      level: "log",
      title,
      message,
      json,
    });
  }

  async handleList({
    level,
    startDate,
    endDate,
    pageIndex,
    pageSize,
  }: ListOptions) {
    const [{ count }] = await this.db
      .select({ count: sql.count() })
      .from(schema.logTable)
      .where(
        sql.and(
          level ? sql.eq(schema.logTable.level, level) : void 0,
          sql.between(
            schema.logTable.date,
            new Date(startDate),
            new Date(endDate),
          ),
        ),
      );

    const rows = await this.db
      .select()
      .from(schema.logTable)
      .where(
        sql.and(
          level ? sql.eq(schema.logTable.level, level) : void 0,
          sql.between(
            schema.logTable.date,
            new Date(startDate),
            new Date(endDate),
          ),
        ),
      )
      .offset(pageIndex * pageSize)
      .limit(pageSize);

    return { count, rows };
  }
}

export interface IPC {
  "logger/list": {
    args: [ListOptions];
    return: ReturnType<Logger["handleList"]>;
  };
}

export const bindIPC = (logger: Logger, ipcHandle: IpcHandle) => {
  ipcHandle("logger/list", (_, options) => {
    return logger.handleList(options);
  });
};
