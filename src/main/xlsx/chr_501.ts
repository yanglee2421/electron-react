import { app } from "electron/main";
import { shell } from "electron/common";
import { join } from "node:path";
import Excel from "@yanglee2421/exceljs";

const calcColumnWidth = (width: number) => width;
const calcRowHeight = (height: number) => height;

const columnWidths = new Map([
  ["A", 4.1],
  ["B", 8.0],
  ["C", 6.9],
  ["D", 2.4],
  ["E", 13.0],
  ["F", 13.0],
  ["G", 13.0],
  ["H", 13.0],
  ["I", 13.0],
  ["J", 13.0],
  ["K", 13.0],
  ["L", 13.0],
  ["M", 13.0],
  ["N", 3.9],
  ["O", 13.0],
  ["P", 13.0],
  ["Q", 13.0],
  ["R", 6.9],
  ["S", 2.4],
  ["T", 13.0],
  ["U", 13.0],
  ["V", 13.0],
  ["W", 13.0],
  ["X", 13.0],
  ["Y", 13.0],
  ["Z", 13.0],
  ["AA", 13.0],
  ["AB", 13.0],
  ["AC", 13.0],
  ["AD", 13.0],
  ["AE", 13.0],
]);

const rowHeights = [
  15, 43.5, 35.25, 27.75, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9,
  24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9, 24.9,
  24.9, 24.9, 32.25, 30.75, 18.0, 26.25, 14.4, 14.4, 28.5, 13.5, 0.75, 2.25,
  1.5, 2.25, 3.0, 3.75, 2.25, 51.75, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0,
  18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0,
  18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0,
  18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 18.0, 16.2,
];

export const chr_501 = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 8.38;
  sheet.properties.defaultRowHeight = 14.25;

  columnWidths.forEach((width, col) => {
    sheet.getColumn(col).width = calcColumnWidth(width);
  });

  rowHeights.forEach((height, idx) => {
    sheet.getRow(idx + 1).height = calcRowHeight(height);
  });

  if (import.meta.env.PROD) {
    await sheet.protect("123456", { formatColumns: true, formatRows: true });
  }
  const outputPath = join(app.getPath("documents"), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  await shell.openPath(outputPath);
};
