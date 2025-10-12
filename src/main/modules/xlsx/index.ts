import { ipcHandle } from "#main/lib";
import { channel } from "#main/channel";
import { chr_502 } from "./chr_502";
import { chr_53a } from "./chr_53a";
import { chr_501 } from "./chr_501";
import { db } from "#main/lib";
import * as sql from "drizzle-orm";
import * as schema from "#main/schema";
import type * as PRELOAD from "#preload/index";

type DeleteParams = {
  id: number;
};

/**
 * CHR53A Work Records
 * CHR501 Dayly Validate
 * CHR502 Quartor Validate
 * CHR503 Yearly Validate
 */
export const initIpc = () => {
  ipcHandle(channel.XLSX_CHR501, (_, id: string) => chr_501(id));
  ipcHandle(channel.xlsx_chr_502, chr_502);
  ipcHandle(channel.xlsx_chr_53a, (_, data) => chr_53a(data));
  ipcHandle(
    channel.sqlite_xlsx_size_c,
    async (_, params: PRELOAD.SqliteXlsxSizeCParams) => {
      const data = await db
        .insert(schema.xlsxSizeTable)
        .values(params)
        .returning();

      return data;
    },
  );
  ipcHandle(
    channel.sqlite_xlsx_size_u,
    async (
      _,
      { id, xlsxName, type, index, size }: PRELOAD.SqliteXlsxSizeUParams,
    ) => {
      const data = await db
        .update(schema.xlsxSizeTable)
        .set({ xlsxName, type, index, size })
        .where(sql.eq(schema.xlsxSizeTable.id, id))
        .returning();
      return data;
    },
  );
  ipcHandle(
    channel.sqlite_xlsx_size_r,
    async (
      _,
      {
        id,
        xlsxName,
        type,
        pageIndex = 0,
        pageSize = 10,
      }: PRELOAD.SqliteXlsxSizeRParams = {},
    ) => {
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
  ipcHandle(channel.sqlite_xlsx_size_d, async (_, { id }: DeleteParams) => {
    const data = await db
      .delete(schema.xlsxSizeTable)
      .where(sql.eq(schema.xlsxSizeTable.id, id))
      .returning();
    return data;
  });
};
