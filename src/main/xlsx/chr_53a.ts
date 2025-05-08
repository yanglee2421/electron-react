import Excel from "@yanglee2421/exceljs";
import { shell } from "electron/common";
import { app } from "electron/main";
import { join } from "node:path";

const calcColumnWidth = (width: number) => width;
const calcRowHeight = (height: number) => height;

const columnWidths = new Map([
  ["A", 1.5],
  ["B", 3.125],
  ["C", 6.625],
  ["D", 7.0],
  ["E", 6.875],
  ["F", 11.375],
  ["G", 13.0],
  ["H", 3.25],
  ["I", 13.0],
  ["J", 3.0],
  ["K", 13.0],
  ["L", 2.875],
  ["M", 3.125],
  ["N", 5.875],
  ["O", 8.25],
]);

const rowHeights = [
  21.75, // 1
  15.6, // 2
  15.6, // 3
  15.6, // 4
  7.5, // 5
  15.6, // 6
  15.6, // 7
  15.6, // 8
  15.6, // 9
  15.6, // 10
  15.6, // 11
  15.6, // 12
  15.6, // 13
  15.6, // 14
  15.6, // 15
  15.6, // 16
  15.6, // 17
  15.6, // 18
  15.6, // 19
  15.6, // 20
  15.6, // 21
  15.6, // 22
  15.6, // 23
  15.6, // 24
  15.6, // 25
  15.6, // 26
  15.6, // 27
  15.6, // 28
  15.6, // 29
  15.6, // 30
  15.6, // 31
  15.6, // 32
  15.6, // 33
  15.6, // 34
  15.6, // 35
  15.6, // 36
  15.6, // 37
  16.35, // 38
  15.6, // 39
  15.6, // 40
  15.6, // 41
  15.6, // 42
  15.6, // 43
  15.6, // 44
  15.6, // 45
  15.6, // 46
];

export const chr_53a = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 8.38;
  sheet.properties.defaultRowHeight = 14.25;

  sheet.mergeCells("A1:O1");
  const cellA1 = sheet.getCell("A1");
  cellA1.value = "车统-53A";
  cellA1.font = { name: "宋体", size: 11, bold: false };
  cellA1.alignment = {
    vertical: "middle",
    horizontal: "right",
    wrapText: false,
  };

  sheet.mergeCells("A2:O2");
  const cellA2 = sheet.getCell("A2");
  cellA2.value = "铁路货车轮轴（轮对、车轴、车轮）超声波（磁粉）探伤记录";
  cellA2.font = { name: "宋体", size: 14, bold: true };
  cellA2.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: false,
  };

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
