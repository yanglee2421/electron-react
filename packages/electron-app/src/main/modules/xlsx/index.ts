import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import type { IpcHandle } from "#main/lib/ipc";
import * as sql from "drizzle-orm";
import { chr_501 } from "./chr_501";
import { chr_502 } from "./chr_502";
import { chr_53a } from "./chr_53a";

/**
 * CHR53A Work Records
 * CHR501 Dayly Validate
 * CHR502 Quartor Validate
 * CHR503 Yearly Validate
 */
export const bindIpcHandlers = (db: SQLiteDBType, ipcHandle: IpcHandle) => {
  ipcHandle("XLSX/XLSX_CHR501", (_, id: string) => chr_501(db, id));
  ipcHandle("XLSX/xlsx_chr_502", () => chr_502(db));
  ipcHandle("XLSX/xlsx_chr_53a", (_, data) => chr_53a(db, data));
  ipcHandle("XLSX/sqlite_xlsx_size_c", async (_, params) => {
    const data = await db
      .insert(schema.xlsxSizeTable)
      .values(params)
      .returning();

    return data;
  });
  ipcHandle(
    "XLSX/sqlite_xlsx_size_u",
    async (_, { id, xlsxName, type, index, size }) => {
      const data = await db
        .update(schema.xlsxSizeTable)
        .set({ xlsxName, type, index, size })
        .where(sql.eq(schema.xlsxSizeTable.id, id))
        .returning();
      return data;
    },
  );
  ipcHandle(
    "XLSX/sqlite_xlsx_size_r",
    async (_, { id, xlsxName, type, pageIndex = 0, pageSize = 10 } = {}) => {
      const wheres = [
        id && sql.eq(schema.xlsxSizeTable.id, id),
        xlsxName && sql.like(schema.xlsxSizeTable.xlsxName, `%${xlsxName}%`),
        type && sql.like(schema.xlsxSizeTable.type, `%${type}%`),
      ].filter((i) => typeof i === "object");

      const whereSearcher = sql.and(...wheres);

      const rows = await db._query.xlsxSizeTable.findMany({
        where: whereSearcher,
        offset: pageIndex * pageSize,
        limit: pageSize,
      });
      const [{ count }] = await db
        .select({ count: sql.count() })
        .from(schema.xlsxSizeTable)
        .where(whereSearcher)
        .limit(1);

      return { count, rows };
    },
  );
  ipcHandle("XLSX/sqlite_xlsx_size_d", async (_, id: number) => {
    const data = await db
      .delete(schema.xlsxSizeTable)
      .where(sql.eq(schema.xlsxSizeTable.id, id))
      .returning();
    return data;
  });
};
