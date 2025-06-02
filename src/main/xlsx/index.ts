import { ipcMain } from "electron/main";
import { withLog } from "#/lib";
import * as channel from "#/channel";
import { chr_502 } from "./chr_502";
import { chr_53a } from "./chr_53a";
import { chr_501 } from "./chr_501";
import { db } from "#/db";
import * as sql from "drizzle-orm";
import * as schema from "#/schema";

type CreateParams = {
  xlsxName: string;
  type: string;
  index: string;
  size: number;
};

type UpdateParams = Partial<CreateParams> & {
  id: number;
};

type ReadParams = {
  id?: number;
  xlsxName?: string;
  type?: string;
};

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
  ipcMain.handle(channel.xlsx_chr_501, withLog(chr_501));
  ipcMain.handle(channel.xlsx_chr_502, withLog(chr_502));
  ipcMain.handle(channel.xlsx_chr_53a, withLog(chr_53a));
  ipcMain.handle(
    channel.sqlite_xlsx_size_c,
    withLog(async (_, { xlsxName, type, index, size }: CreateParams) => {
      const data = await db
        .insert(schema.xlsxSizeTable)
        .values([
          {
            xlsxName,
            type,
            index,
            size,
          },
        ])
        .returning();

      return data;
    }),
  );
  ipcMain.handle(
    channel.sqlite_xlsx_size_u,
    withLog(async (_, { id, xlsxName, type, index, size }: UpdateParams) => {
      const data = await db
        .update(schema.xlsxSizeTable)
        .set({ xlsxName, type, index, size })
        .where(sql.eq(schema.xlsxSizeTable.id, id))
        .returning();
      return data;
    }),
  );
  ipcMain.handle(
    channel.sqlite_xlsx_size_r,
    withLog(async (_, { id, xlsxName, type }: ReadParams) => {
      const wheres = [
        id && sql.eq(schema.xlsxSizeTable.id, id),
        xlsxName && sql.like(schema.xlsxSizeTable.xlsxName, `%${xlsxName}%`),
        type && sql.like(schema.xlsxSizeTable.type, `%${type}%`),
      ].filter((i) => typeof i === "object");

      const data = await db.query.xlsxSizeTable.findFirst({
        where: sql.and(...wheres),
      });

      if (!data) throw new Error("404, 未发现");

      return data;
    }),
  );
  ipcMain.handle(
    channel.sqlite_xlsx_size_d,
    withLog(async (_, { id }: DeleteParams) => {
      const data = await db
        .delete(schema.xlsxSizeTable)
        .where(sql.eq(schema.xlsxSizeTable.id, id))
        .returning();
      return data;
    }),
  );
};
