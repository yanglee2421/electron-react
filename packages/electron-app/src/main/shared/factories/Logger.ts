import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import type { IpcHandle } from "#main/lib/ipc";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";

interface LoggerOptions {
  title: string;
  message?: string;
  json?: string;
}

export interface ListOptions {
  level?: string;
  startDate: string;
  endDate: string;
  pageIndex: number;
  pageSize: number;
}

export class Logger {
  private db: SQLiteDBType;
  private handlers: Set<() => void> = new Set();

  constructor(db: SQLiteDBType) {
    this.db = db;
  }

  on(handler: () => void) {
    this.handlers.add(handler);

    return () => {
      this.off(handler);
    };
  }
  off(handler: () => void) {
    this.handlers.delete(handler);
  }
  emit() {
    this.handlers.forEach((handler) => handler());
  }

  async error({ title, message, json }: LoggerOptions) {
    if (Math.random() < 0.01) {
      void this.handleClearExpired();
    }

    await this.db.insert(schema.logTable).values({
      level: "error",
      title,
      message,
      json,
    });

    this.emit();
  }
  async log({ title, message, json }: LoggerOptions) {
    if (Math.random() < 0.01) {
      void this.handleClearExpired();
    }

    await this.db.insert(schema.logTable).values({
      level: "log",
      title,
      message,
      json,
    });

    this.emit();
  }

  async handleList({
    level,
    startDate,
    endDate,
    pageIndex,
    pageSize,
  }: ListOptions) {
    if (Math.random() < 0.01) {
      void this.handleClearExpired();
    }

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
  handleDelete(id: number) {
    if (Math.random() < 0.01) {
      void this.handleClearExpired();
    }

    return this.db
      .delete(schema.logTable)
      .where(sql.eq(schema.logTable.id, id))
      .returning();
  }
  handleClear() {
    return this.db.delete(schema.logTable).returning();
  }
  async handleClearExpired() {
    // Drizzle use Thenable to execute SQL
    // So we must await it to trigger the delete operation
    await this.db
      .delete(schema.logTable)
      .where(
        sql.lt(schema.logTable.date, dayjs().subtract(30, "day").toDate()),
      );
  }
}

export interface IPC {
  "logger/list": {
    args: [ListOptions];
    return: ReturnType<Logger["handleList"]>;
  };
  "logger/delete": {
    args: [number];
    return: ReturnType<Logger["handleDelete"]>;
  };
  "logger/clear": {
    args: [];
    return: ReturnType<Logger["handleClear"]>;
  };
}

export const bindIPC = (logger: Logger, ipcHandle: IpcHandle) => {
  ipcHandle("logger/list", (_, options) => {
    return logger.handleList(options);
  });
  ipcHandle("logger/delete", (_, id) => {
    return logger.handleDelete(id);
  });
  ipcHandle("logger/clear", () => {
    return logger.handleClear();
  });
};
