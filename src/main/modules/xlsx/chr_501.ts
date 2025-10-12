import { app, shell } from "electron";
import { join } from "node:path";
import Excel from "@yanglee2421/exceljs";
import { db } from "#main/lib";
import * as schema from "#main/schema";
import * as sql from "drizzle-orm";
import { createCellHelper, createRowHelper, pageSetup } from "#main/utils";
import { getDataFromRootDB as getDataFromMDB } from "#main/modules/mdb";
import type { Verify } from "#main/modules/cmd";

const columnWidths = new Map([
  ["A", 4.1],
  ["B", 8.0],
  ["C", 6.9],
  ["D", 2.4],
  ["E", 10],
  ["F", 10],
  ["G", 10],
  ["H", 10],
  ["I", 10],
  ["J", 10],
  ["K", 10],
  ["L", 10],
  ["M", 10],
  ["N", 3.9],
  ["O", 10],
  ["P", 10],
  ["Q", 10],
  ["R", 6.9],
  ["S", 2.4],
  ["T", 10],
  ["U", 10],
  ["V", 10],
  ["W", 10],
  ["X", 10],
  ["Y", 10],
  ["Z", 10],
  ["AA", 10],
  ["AB", 10],
  ["AC", 10],
  ["AD", 10],
  ["AE", 10],
]);

const rowHeights = new Map([
  [1, 24],
  [2, 8],
  [3, 18],
  [4, 8],
  [5, 18],
  [6, 18],
  [7, 18],
]);

export const chr_501 = async (id: string) => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 10;
  sheet.properties.defaultRowHeight = 16;

  pageSetup(sheet);
  sheet.pageSetup.printArea = "A1:N47";

  sheet.headerFooter.oddHeader = "&R车统-501";
  sheet.headerFooter.evenHeader = "&R车统-501";
  sheet.headerFooter.oddFooter = "第 &P 页，共 &N 页";
  sheet.headerFooter.evenFooter = "第 &P 页，共 &N 页";

  const tr = createRowHelper(sheet, { height: 16 });
  const td = createCellHelper(sheet);

  tr(1, (index) => {
    td(`A${index}:N${index}`);
  });

  const data = await getDataFromMDB<Verify>({
    tableName: "verifies",
    filters: [{ type: "equal", field: "szIDs", value: id }],
  });

  console.log(data);

  columnWidths.forEach((width, col) => {
    sheet.getColumn(col).width = width;
  });

  rowHeights.forEach((height, rowId) => {
    sheet.getRow(rowId).height = height;
  });

  const rowHeightList = await db
    .select({
      index: schema.xlsxSizeTable.index,
      size: schema.xlsxSizeTable.size,
    })
    .from(schema.xlsxSizeTable)
    .where(
      sql.and(
        sql.eq(schema.xlsxSizeTable.xlsxName, "chr53a"),
        sql.eq(schema.xlsxSizeTable.type, "row"),
      ),
    );
  const columnWidthList = await db
    .select({
      index: schema.xlsxSizeTable.index,
      size: schema.xlsxSizeTable.size,
    })
    .from(schema.xlsxSizeTable)
    .where(
      sql.and(
        sql.eq(schema.xlsxSizeTable.xlsxName, "chr53a"),
        sql.eq(schema.xlsxSizeTable.type, "column"),
      ),
    );

  rowHeightList.forEach(({ index, size }) => {
    if (!size) return;
    if (!index) return;
    sheet.getRow(Number.parseInt(index)).height = size;
  });
  columnWidthList.forEach(({ index, size }) => {
    if (!size) return;
    if (!index) return;
    sheet.getColumn(index).width = size;
  });

  if (import.meta.env.PROD) {
    await sheet.protect("123456", { formatColumns: true, formatRows: true });
  }
  const outputPath = join(app.getPath("documents"), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  await shell.openPath(outputPath);
};
