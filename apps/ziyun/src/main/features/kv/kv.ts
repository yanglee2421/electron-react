import * as schema from "#main/features/db/schema";
import type { DBClient } from "#main/features/db/types";
import * as sql from "drizzle-orm";
import { Subject } from "rxjs";
import type { AppCradle } from "../types";
import type { KVEvent } from "./types";

export class KV {
  readonly events$ = new Subject<KVEvent>();
  private db: DBClient;

  constructor({ db }: AppCradle) {
    this.db = db.client;
  }

  dispose() {
    this.events$.complete();
  }

  getItem(key: string): string | null {
    const result = this.db
      .select()
      .from(schema.kvTable)
      .where(sql.eq(schema.kvTable.key, key))
      .get();

    return result ? result.value : null;
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

    this.events$.next({ action: "set", key, value });
  }
  removeItem(key: string) {
    this.db.delete(schema.kvTable).where(sql.eq(schema.kvTable.key, key)).run();

    this.events$.next({ action: "remove", key });
  }
  clear(): void {
    this.db.delete(schema.kvTable).run();

    this.events$.next({ action: "clear" });
  }
}
