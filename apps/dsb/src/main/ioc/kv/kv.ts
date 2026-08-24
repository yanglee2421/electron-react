import * as schema from "#main/ioc/app-db/schema";
import { eq } from "drizzle-orm";
import { Subject } from "rxjs";
import type { DBClient } from "../app-db/app-db";
import type { AppCradle } from "../types";

export class KV {
  private event$ = new Subject();

  private db: DBClient;

  constructor({ appDB }: AppCradle) {
    this.db = appDB.client;
  }

  dispose() {
    this.event$.complete();
  }

  getItem(key: string) {
    const row = this.db
      .select({ value: schema.kvTable.value })
      .from(schema.kvTable)
      .where(eq(schema.kvTable.key, key))
      .get();

    if (!row) {
      return null;
    }

    return row.value;
  }
  setItem(key: string, value: string) {
    this.db
      .insert(schema.kvTable)
      .values({ key, value })
      .onConflictDoUpdate({
        target: schema.kvTable.key,
        set: { value },
      })
      .run();
    this.event$.next({ action: "setItem", key, value });
  }
  removeItem(key: string) {
    this.db.delete(schema.kvTable).where(eq(schema.kvTable.key, key)).run();
    this.event$.next({ action: "removeItem", key });
  }
  clear() {
    this.db.delete(schema.kvTable).run();
    this.event$.next({ action: "clear" });
  }
}
