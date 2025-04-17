import { db } from "./db.js";
import * as schema from "./schema";
import * as sql from "drizzle-orm";

class Setting {
  listeners = new Set<() => void>();
  on(handler: () => void) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }
  emit() {
    this.listeners.forEach((listener) => listener());
  }

  /*
   * Optimize performance
   * Create snapshot to avoid unnecessary database queries
   */
  hasInitialized = false;
  snapshot: schema.Settings = {
    id: 0,
    databasePath: null,
    driverPath: null,
    activateCode: null,
  };

  async init() {
    const setting = await db.query.settingsTable.findFirst({
      where: sql.eq(schema.settingsTable.id, 1),
    });

    if (!setting) {
      const [created] = await db
        .insert(schema.settingsTable)
        .values({
          id: 1,
        })
        .returning();

      this.snapshot = created;
    } else {
      this.snapshot = setting;
    }

    this.hasInitialized = true;
    this.emit();
  }

  async get() {
    if (!this.hasInitialized) {
      await this.init();
    }

    return this.snapshot;
  }

  async set(params: Partial<Omit<schema.Settings, "id">>) {
    const [updated] = await db
      .insert(schema.settingsTable)
      .values({ ...params, id: 1 })
      .onConflictDoUpdate({
        target: schema.settingsTable.id,
        targetWhere: sql.eq(schema.settingsTable.id, 1),
        set: params,
      })
      .returning();

    this.snapshot = updated;
    this.emit();
  }
}

export const setting = new Setting();
