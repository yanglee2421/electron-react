import { type SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import * as sql from "drizzle-orm";

export class KV {
  #handles: Set<(key: string) => void> = new Set();
  db: SQLiteDBType;

  constructor(db: SQLiteDBType) {
    this.db = db;
  }

  on(fn: (key: string) => void) {
    this.#handles.add(fn);

    return () => {
      this.off(fn);
    };
  }
  off(fn: (key: string) => void) {
    this.#handles.delete(fn);
  }
  emit(key: string) {
    this.#handles.forEach((fn) => fn(key));
  }

  async getItem(key: string): Promise<string | null> {
    const rows = await this.db
      .select()
      .from(schema.kvTable)
      .where(sql.eq(schema.kvTable.key, key));

    const value = rows.at(0)?.value ?? null;

    return value;
  }
  async setItem(key: string, value: string) {
    await this.db
      .insert(schema.kvTable)
      .values({ key, value })
      .onConflictDoUpdate({
        target: schema.kvTable.key,
        set: { value },
      });

    this.emit(key);
  }
  async removeItem(key: string) {
    await this.db.delete(schema.kvTable).where(sql.eq(schema.kvTable.key, key));

    this.emit(key);
  }
}
