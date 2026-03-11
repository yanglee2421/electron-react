import { type SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import type { IpcHandle } from "#main/lib/ipc";
import * as sql from "drizzle-orm";

export interface IpcContract {
  "kv/get": {
    args: [string];
    return: string | null;
  };
  "kv/set": {
    args: [string, string];
    return: void;
  };
  "kv/remove": {
    args: [string];
    return: void;
  };
}

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

export const bindIpc = (kv: KV, ipcHandle: IpcHandle) => {
  ipcHandle("kv/get", async (_, key: string) => {
    return await kv.getItem(key);
  });
  ipcHandle("kv/set", async (_, key: string, value: string) => {
    await kv.setItem(key, value);
  });
  ipcHandle("kv/remove", async (_, key: string) => {
    await kv.removeItem(key);
  });
};
