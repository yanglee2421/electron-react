import { app, shell } from "electron";
import { join } from "node:path";
import Excel from "@yanglee2421/exceljs";
import { db } from "#/db";
import * as schema from "#/schema";
import * as sql from "drizzle-orm";

const columnWidths = new Map([
  ["A", 8],
  ["B", 8],
  ["C", 4],
  ["D", 4],
  ["E", 4],
  ["F", 4],
  ["G", 4],
  ["H", 4],
  ["I", 4],
  ["J", 4],
  ["K", 4],
  ["L", 4],
  ["M", 4],
  ["N", 4],
  ["O", 4],
  ["P", 4],
  ["Q", 4],
  ["R", 4],
  ["S", 4],
  ["T", 4],
  ["U", 4],
  ["V", 4],
  ["W", 4],
  ["X", 4],
  ["Y", 4],
  ["Z", 4],
  ["AA", 8],
]);

const rowHeights = new Map([
  [1, 50],
  [2, 48],
  [3, 40],
  [4, 34],
  [5, 44],
  [6, 28],
  [7, 24],
  [8, 24],
  [9, 24],
  [10, 24],
  [11, 24],
  [12, 24],
  [13, 24],
  [14, 24],
  [15, 24],
  [16, 24],
  [17, 24],
  [18, 24],
  [19, 24],
  [20, 24],
  [21, 24],
  [22, 30],
  [23, 30],
  [24, 30],
  [25, 30],
  [26, 34],
  [27, 34],
  [28, 28],
]);

const border4 = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
} as const;

const alignCenter = {
  vertical: "middle",
  horizontal: "center",
  wrapText: false,
} as const;

const typography = {
  name: "宋体",
  size: 10,
  bold: false,
  underline: false,
} as const;

export const chr_502 = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 10;
  sheet.properties.defaultRowHeight = 16;

  // A4
  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "portrait";
  sheet.pageSetup.horizontalCentered = true;
  sheet.pageSetup.verticalCentered = false;
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.printArea = "A1:AA28";

  sheet.headerFooter.oddHeader = "&R辆货统-502";
  sheet.headerFooter.evenHeader = "&R辆货统-502";
  sheet.headerFooter.oddFooter = "第 &P 页，共 &N 页";
  sheet.headerFooter.evenFooter = "第 &P 页，共 &N 页";

  sheet.mergeCells("A1:AA1");
  const cellA1 = sheet.getCell("A1");
  cellA1.value = "单位名称：";
  cellA1.value = "铁路货车轮轴B/C型显示超声波自动探伤系统季度性能校验记录";
  cellA1.font = { name: "宋体", size: 16, bold: true };
  cellA1.alignment = alignCenter;

  sheet.mergeCells("A2:B2");
  const cellA2 = sheet.getCell("A2");
  cellA2.value = "单位名称：";
  cellA2.font = { name: "宋体", size: 10, bold: false };
  cellA2.alignment = alignCenter;
  cellA2.border = border4;

  sheet.mergeCells("C2:N2");
  const cellC2 = sheet.getCell("C2");
  cellC2.value = "武汉江岸车辆段武南轮厂检修车间";
  cellC2.font = { name: "宋体", size: 10, bold: true, underline: true };
  cellC2.alignment = alignCenter;
  cellC2.border = border4;

  sheet.mergeCells("O2:R2");
  const cellO2 = sheet.getCell("O2:R2");
  cellO2.border = border4;

  sheet.mergeCells("S2:V2");
  const cellS2 = sheet.getCell("S2");
  cellS2.value = "检验时间：";
  cellS2.font = { name: "宋体", size: 10, bold: true };
  cellS2.alignment = alignCenter;
  cellS2.border = border4;

  sheet.mergeCells("W2:AA2");
  const cellW2 = sheet.getCell("W2:AA2");
  cellW2.value = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  cellW2.font = { name: "宋体", size: 10, bold: true, underline: true };
  cellW2.alignment = alignCenter;
  cellW2.border = border4;

  const cellA3 = sheet.getCell("A3");
  cellA3.value = "设备编号";
  cellA3.font = typography;
  cellA3.alignment = alignCenter;
  cellA3.border = border4;

  const cellB3 = sheet.getCell("B3");
  cellB3.value = "";
  cellB3.font = typography;
  cellB3.alignment = alignCenter;
  cellB3.border = border4;

  sheet.mergeCells("C3:F3");
  const cellC3 = sheet.getCell("C3");
  cellC3.value = "制造时间";
  cellC3.font = typography;
  cellC3.alignment = alignCenter;
  cellC3.border = border4;

  sheet.mergeCells("G3:J3");
  const cellG3 = sheet.getCell("G3");
  cellG3.value = "";
  cellG3.font = typography;
  cellG3.alignment = alignCenter;
  cellG3.border = border4;

  sheet.mergeCells("K3:N3");
  const cellK3 = sheet.getCell("K3");
  cellK3.value = "制造单位";
  cellK3.font = typography;
  cellK3.alignment = alignCenter;
  cellK3.border = border4;

  sheet.mergeCells("O3:R3");
  const cellO3 = sheet.getCell("O3");
  cellO3.value = "";
  cellO3.font = typography;
  cellO3.alignment = alignCenter;
  cellO3.border = border4;

  sheet.mergeCells("S3:V3");
  const cellS3 = sheet.getCell("S3");
  cellS3.value = "上次检修时间";
  cellS3.font = typography;
  cellS3.alignment = alignCenter;
  cellS3.border = border4;

  sheet.mergeCells("W3:AA3");
  const cellW3 = sheet.getCell("W3:AA3");
  cellW3.value = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  cellW3.font = typography;
  cellW3.alignment = alignCenter;
  cellW3.border = border4;

  sheet.mergeCells("A4:B6");
  const cellA4 = sheet.getCell("A4");
  cellA4.value = "通道";
  cellA4.font = typography;
  cellA4.alignment = alignCenter;
  cellA4.border = border4;

  sheet.mergeCells("C4:Z4");
  const cellC4 = sheet.getCell("C4");
  cellC4.value = "反射波高(dB)";
  cellC4.font = typography;
  cellC4.alignment = alignCenter;
  cellC4.border = border4;

  const cellAA4 = sheet.getCell("AA4");
  cellAA4.value = "";
  cellAA4.font = typography;
  cellAA4.alignment = alignCenter;
  cellAA4.border = border4;

  sheet.mergeCells("C5:F5");
  const cellC5 = sheet.getCell("C5");
  cellC5.value = "第一次";
  cellC5.font = typography;
  cellC5.alignment = alignCenter;
  cellC5.border = border4;

  sheet.mergeCells("G5:J5");
  const cellG5 = sheet.getCell("G5");
  cellG5.value = "第二次";
  cellG5.font = typography;
  cellG5.alignment = alignCenter;
  cellG5.border = border4;

  sheet.mergeCells("K5:N5");
  const cellK5 = sheet.getCell("K5");
  cellK5.value = "第三次";
  cellK5.font = typography;
  cellK5.alignment = alignCenter;
  cellK5.border = border4;

  sheet.mergeCells("O5:R5");
  const cellO5 = sheet.getCell("O5");
  cellO5.value = "第四次";
  cellO5.font = typography;
  cellO5.alignment = alignCenter;
  cellO5.border = border4;

  sheet.mergeCells("S5:V5");
  const cellS5 = sheet.getCell("S5");
  cellS5.value = "第五次";
  cellS5.font = typography;
  cellS5.alignment = alignCenter;
  cellS5.border = border4;

  sheet.mergeCells("W5:Z5");
  const cellW5 = sheet.getCell("W5");
  cellW5.value = "最大差值(dB)";
  cellW5.font = typography;
  cellW5.alignment = alignCenter;
  cellW5.border = border4;

  const cellAA5 = sheet.getCell("AA5");
  cellAA5.value = "结果评定";
  cellAA5.font = typography;
  cellAA5.alignment = alignCenter;
  cellAA5.border = border4;

  sheet.mergeCells("C6:D6");
  const cellC6 = sheet.getCell("C6");
  cellC6.value = "左";
  cellC6.font = typography;
  cellC6.alignment = alignCenter;
  cellC6.border = border4;

  sheet.mergeCells("E6:F6");
  const cellE6 = sheet.getCell("E6");
  cellE6.value = "右";
  cellE6.font = typography;
  cellE6.alignment = alignCenter;
  cellE6.border = border4;

  sheet.mergeCells("G6:H6");
  const cellG6 = sheet.getCell("G6");
  cellG6.value = "左";
  cellG6.font = typography;
  cellG6.alignment = alignCenter;
  cellG6.border = border4;

  sheet.mergeCells("I6:J6");
  const cellI6 = sheet.getCell("I6");
  cellI6.value = "右";
  cellI6.font = typography;
  cellI6.alignment = alignCenter;
  cellI6.border = border4;

  sheet.mergeCells("K6:L6");
  const cellK6 = sheet.getCell("K6");
  cellK6.value = "左";
  cellK6.font = typography;
  cellK6.alignment = alignCenter;
  cellK6.border = border4;

  sheet.mergeCells("M6:N6");
  const cellM6 = sheet.getCell("M6");
  cellM6.value = "右";
  cellM6.font = typography;
  cellM6.alignment = alignCenter;
  cellM6.border = border4;

  sheet.mergeCells("O6:P6");
  const cellO6 = sheet.getCell("O6");
  cellO6.value = "左";
  cellO6.font = typography;
  cellO6.alignment = alignCenter;
  cellO6.border = border4;

  sheet.mergeCells("Q6:R6");
  const cellQ6 = sheet.getCell("Q6");
  cellQ6.value = "右";
  cellQ6.font = typography;
  cellQ6.alignment = alignCenter;
  cellQ6.border = border4;

  sheet.mergeCells("S6:T6");
  const cellS6 = sheet.getCell("S6");
  cellS6.value = "左";
  cellS6.font = typography;
  cellS6.alignment = alignCenter;
  cellS6.border = border4;

  sheet.mergeCells("U6:V6");
  const cellU6 = sheet.getCell("U6");
  cellU6.value = "右";
  cellU6.font = typography;
  cellU6.alignment = alignCenter;
  cellU6.border = border4;

  sheet.mergeCells("W6:X6");
  const cellW6 = sheet.getCell("W6");
  cellW6.value = "左";
  cellW6.font = typography;
  cellW6.alignment = alignCenter;
  cellW6.border = border4;

  sheet.mergeCells("Y6:Z6");
  const cellY6 = sheet.getCell("Y6");
  cellY6.value = "右";
  cellY6.font = typography;
  cellY6.alignment = alignCenter;
  cellY6.border = border4;

  const cellAA6 = sheet.getCell("AA6");
  cellAA6.value = "";
  cellAA6.font = typography;
  cellAA6.alignment = alignCenter;
  cellAA6.border = border4;

  sheet.mergeCells("A7:A8");
  const cellA8 = sheet.getCell("A8");
  cellA8.value = "轴颈\n根部";
  cellA8.font = typography;
  cellA8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA8.border = border4;

  const cellB8 = sheet.getCell("B8");
  cellB8.value = "1";
  cellB8.font = typography;
  cellB8.alignment = alignCenter;
  cellB8.border = border4;

  sheet.mergeCells("A9:A20");
  const cellA10 = sheet.getCell("A10");
  cellA10.value = "轮\n座\n镶\n入\n部";
  cellA10.font = typography;
  cellA10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA10.border = border4;

  for (let i = 7; i < 22; i++) {
    const cellB = sheet.getCell(`B${i}`);
    cellB.font = typography;
    cellB.alignment = alignCenter;
    cellB.border = border4;
    switch (i) {
      case 7:
      case 9:
      case 21:
        cellB.value = "1";
        break;
      case 8:
      case 10:
        cellB.value = "2";
        break;
      default:
        cellB.value = "";
    }

    ["C", "E", "G", "I", "K", "M", "O", "Q", "S", "U", "W", "Y"].forEach(
      (col) => {
        const startCol = col;
        const endCol = String.fromCharCode(col.charCodeAt(0) + 1);
        sheet.mergeCells(`${startCol}${i}:${endCol}${i}`);
        const cell = sheet.getCell(`${startCol}${i}`);
        cell.font = typography;
        cell.alignment = alignCenter;
        cell.border = border4;
        cell.value = "";
      },
    );

    const cellAA = sheet.getCell(`AA${i}`);
    cellAA.value = "";
    cellAA.font = typography;
    cellAA.alignment = alignCenter;
    cellAA.border = border4;
  }

  const cellA21 = sheet.getCell("A21");
  cellA21.value = "全轴穿透";
  cellA21.font = typography;
  cellA21.alignment = alignCenter;
  cellA21.border = border4;

  sheet.mergeCells("A22:A25");
  const cellA22 = sheet.getCell("A22");
  cellA22.value = "参加\n人员\n签章";
  cellA22.font = typography;
  cellA22.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA22.border = border4;

  sheet.mergeCells("B22:D23");
  const cellB22 = sheet.getCell("B22");
  cellB22.value = "探伤工";
  cellB22.font = typography;
  cellB22.alignment = alignCenter;
  cellB22.border = border4;

  sheet.mergeCells("E22:H23");
  const cellE22 = sheet.getCell("E22");
  cellE22.value = "";
  cellE22.font = typography;
  cellE22.alignment = alignCenter;
  cellE22.border = border4;

  sheet.mergeCells("I22:K23");
  const cellI22 = sheet.getCell("I22");
  cellI22.value = "探伤工长";
  cellI22.font = typography;
  cellI22.alignment = alignCenter;
  cellI22.border = border4;

  sheet.mergeCells("L22:O23");
  const cellL22 = sheet.getCell("L22");
  cellL22.value = "";
  cellL22.font = typography;
  cellL22.alignment = alignCenter;
  cellL22.border = border4;

  sheet.mergeCells("P22:R23");
  const cellP22 = sheet.getCell("P22");
  cellP22.value = "质检员";
  cellP22.font = typography;
  cellP22.alignment = alignCenter;
  cellP22.border = border4;

  sheet.mergeCells("S22:V23");
  const cellS22 = sheet.getCell("S22");
  cellS22.value = "";
  cellS22.font = typography;
  cellS22.alignment = alignCenter;
  cellS22.border = border4;

  sheet.mergeCells("W22:Y23");
  const cellW22 = sheet.getCell("W22");
  cellW22.value = "验收员";
  cellW22.font = typography;
  cellW22.alignment = alignCenter;
  cellW22.border = border4;

  sheet.mergeCells("Z22:AA23");
  const cellZ22 = sheet.getCell("Z22");
  cellZ22.value = "";
  cellZ22.font = typography;
  cellZ22.alignment = alignCenter;
  cellZ22.border = border4;

  sheet.mergeCells("B24:D25");
  const cellB24 = sheet.getCell("B24");
  cellB24.value = "设备维修工";
  cellB24.font = typography;
  cellB24.alignment = alignCenter;
  cellB24.border = border4;

  sheet.mergeCells("E24:H25");
  const cellE24 = sheet.getCell("E24");
  cellE24.value = "";
  cellE24.font = typography;
  cellE24.alignment = alignCenter;
  cellE24.border = border4;

  sheet.mergeCells("I24:K25");
  const cellI24 = sheet.getCell("I24");
  cellI24.value = "轮轴专职";
  cellI24.font = typography;
  cellI24.alignment = alignCenter;
  cellI24.border = border4;

  sheet.mergeCells("L24:O25");
  const cellL24 = sheet.getCell("L24");
  cellL24.value = "";
  cellL24.font = typography;
  cellL24.alignment = alignCenter;
  cellL24.border = border4;

  sheet.mergeCells("P24:R25");
  const cellP24 = sheet.getCell("P24");
  cellP24.value = "设备专职";
  cellP24.font = typography;
  cellP24.alignment = alignCenter;
  cellP24.border = border4;

  sheet.mergeCells("S24:V25");
  const cellS24 = sheet.getCell("S24");
  cellS24.value = "";
  cellS24.font = typography;
  cellS24.alignment = alignCenter;
  cellS24.border = border4;

  sheet.mergeCells("W24:Y25");
  const cellW24 = sheet.getCell("W24");
  cellW24.value = "主管领导";
  cellW24.font = typography;
  cellW24.alignment = alignCenter;
  cellW24.border = border4;

  sheet.mergeCells("Z24:AA25");
  const cellZ24 = sheet.getCell("Z24");
  cellZ24.value = "";
  cellZ24.font = typography;
  cellZ24.alignment = alignCenter;
  cellZ24.border = border4;

  sheet.mergeCells("A26:D26");
  const cellA26 = sheet.getCell("A26");
  cellA26.value = "备注";
  cellA26.font = { name: "宋体", size: 12, bold: false };
  cellA26.alignment = alignCenter;
  cellA26.border = border4;

  sheet.mergeCells("E26:AA26");
  const cellE26 = sheet.getCell("E26");
  cellE26.value = "";
  cellE26.font = { name: "宋体", size: 12, bold: false };
  cellE26.alignment = alignCenter;
  cellE26.border = border4;

  sheet.mergeCells("A27:AA27");
  const cellA27 = sheet.getCell("A27");
  cellA27.value =
    "注：最大差值(ΔdB)是指五次波幅测量值中最大值与最小值之差，要求ΔdB≤6dB。";
  cellA27.font = { name: "宋体", size: 12, bold: false };
  cellA27.alignment = alignCenter;

  rowHeights.forEach((height, rowId) => {
    sheet.getRow(rowId).height = height;
  });

  columnWidths.forEach((width, columnId) => {
    sheet.getColumn(columnId).width = width;
  });

  const rowHeightList = await db
    .select({
      index: schema.xlsxSizeTable.index,
      size: schema.xlsxSizeTable.size,
    })
    .from(schema.xlsxSizeTable)
    .where(
      sql.and(
        sql.eq(schema.xlsxSizeTable.xlsxName, "chr502"),
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
        sql.eq(schema.xlsxSizeTable.xlsxName, "chr502"),
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
