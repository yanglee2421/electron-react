import * as sql from "drizzle-orm";
import * as schema from "#main/schema";
import { ipcHandle } from "#main/lib/ipc";
import { chr_502 } from "./chr_502";
import { chr_53a } from "./chr_53a";
import { chr_501 } from "./chr_501";
import type { AppContext } from "#main/index";

/**
 * CHR53A Work Records
 * CHR501 Dayly Validate
 * CHR502 Quartor Validate
 * CHR503 Yearly Validate
 */
export const bindIpcHandlers = (appContext: AppContext) => {
  const { sqliteDB: db } = appContext;

  ipcHandle("XLSX/XLSX_CHR501", (_, id: string) => chr_501(appContext, id));
  ipcHandle("XLSX/xlsx_chr_502", () => chr_502(appContext));
  ipcHandle("XLSX/xlsx_chr_53a", (_, data) => chr_53a(appContext, data));
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

      const rows = await db.query.xlsxSizeTable.findMany({
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
