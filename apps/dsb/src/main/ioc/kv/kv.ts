import * as schema from "#main/ioc/app-db/schema";
import { ipcHandle, ipcRemoveHandle } from "#main/ipc";
import { eq } from "drizzle-orm";
import { Subject } from "rxjs";
import type { DBClient } from "../app-db/app-db";
import type { AppCradle } from "../types";
import type { KVEvent } from "./types";

export class KV {
  readonly event$ = new Subject<KVEvent>();
  private db: DBClient;

  constructor({ appDB }: AppCradle) {
    this.db = appDB.client;
    ipcHandle("kv/clear", () => this.clear());
    ipcHandle("kv/get-item", (_, p) => this.getItem(p));
    ipcHandle("kv/remove-item", (_, p) => this.removeItem(p));
    ipcHandle("kv/set-item", (_, p, v) => this.setItem(p, v));
  }

  dispose() {
    this.event$.complete();
    ipcRemoveHandle("kv/clear");
    ipcRemoveHandle("kv/get-item");
    ipcRemoveHandle("kv/remove-item");
    ipcRemoveHandle("kv/set-item");
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
    this.event$.next({ action: "set", key, value });
  }
  removeItem(key: string) {
    this.db.delete(schema.kvTable).where(eq(schema.kvTable.key, key)).run();
    this.event$.next({ action: "remove", key });
  }
  clear() {
    this.db.delete(schema.kvTable).run();
    this.event$.next({ action: "clear" });
  }
}
