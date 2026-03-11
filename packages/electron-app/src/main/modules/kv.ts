import { type SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import { ipcHandle } from "#main/lib/ipc";
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
  timer: NodeJS.Timeout | null = null;
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

    this.onUpdate(key);
  }

  async removeItem(key: string) {
    await this.db.delete(schema.kvTable).where(sql.eq(schema.kvTable.key, key));

    this.onUpdate(key);
  }

  onUpdate(key: string) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.#handles.forEach((fn) => fn(key));

      // Single source of truth is in main process,
      // so we only notify other windows to update their cache after a change happens.
      // Renderer processes should actively listen to the change and update their cache accordingly.

      // BrowserWindow.getAllWindows().forEach((win) => {
      //   win.webContents.send("kv/set", key);
      // });
    }, 500);
  }

  bindIpc() {
    ipcHandle("kv/get", async (_, key: string) => {
      return await this.getItem(key);
    });
    ipcHandle("kv/set", async (_, key: string, value: string) => {
      await this.setItem(key, value);
    });
    ipcHandle("kv/remove", async (_, key: string) => {
      await this.removeItem(key);
    });
  }
}
