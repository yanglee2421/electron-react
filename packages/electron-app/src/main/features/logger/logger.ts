import * as schema from "#main/features/db/schema";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import { Subject } from "rxjs";
import type { DBClient } from "../db/types";
import type { AppCradle } from "../types";
import type { ListOptions } from "./types";

interface LoggerOptions {
  title: string;
  message?: string;
  json?: string;
}

export class Logger {
  readonly event$ = new Subject<void>();
  private db: DBClient;

  constructor({ db }: AppCradle) {
    this.db = db.client;
  }

  private emit() {
    this.event$.next();
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
