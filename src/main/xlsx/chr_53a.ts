import Excel from "@yanglee2421/exceljs";
import { shell } from "electron/common";
import { app } from "electron/main";
import { join } from "node:path";
import { db } from "#/db";
import * as schema from "#/schema";
import * as sql from "drizzle-orm";

const columnWidths = new Map([
  ["A", 4],
  ["B", 8],
  ["C", 8],
  ["D", 8],
  ["E", 8],
  ["F", 8],
  ["G", 4],
  ["H", 4],
  ["I", 4],
  ["J", 4],
  ["K", 4],
  ["L", 4],
  ["M", 8],
  ["N", 10],
]);

const rowHeights = new Map([
  [1, 24],
  [2, 12],
  [3, 18],
  [4, 12],
  [5, 18],
  [6, 18],
  [7, 18],
  [8, 16],
  [9, 16],
  [10, 16],
  [11, 16],
  [12, 16],
  [13, 16],
  [14, 16],
  [15, 16],
  [16, 16],
  [17, 16],
  [18, 16],
  [19, 16],
  [20, 16],
  [21, 16],
  [22, 16],
  [23, 16],
  [24, 16],
  [25, 16],
  [26, 16],
  [27, 16],
  [28, 16],
  [29, 16],
  [30, 16],
  [31, 16],
  [32, 16],
  [33, 16],
  [34, 16],
  [35, 16],
  [36, 16],
  [37, 16],
  [38, 16],
  [39, 16],
  [40, 16],
  [41, 16],
  [42, 16],
  [43, 16],
  [44, 16],
  [45, 16],
  [46, 16],
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

const inspectionItems = [
  "注：探测部位中,①②和③分别代表如下内容",
  "磁粉探伤时：①代表轴身；②代表轮座或幅板孔；③代表轴颈及防尘板座。探测时应在被探",
  "测部位栏中画“√”，全轴都探时，①②和③则都画“√”",
  "超声波探伤时，①代表全轴穿透；②代表轮座镶入部；③代表轴颈根部（或卸荷槽）部位。",
  "探测时应在被探测部位栏中画“√”",
  "探伤方法，记录磁探、超探、微控超探",
  "探伤性质，记录初探和复探，初探和复探分别填写车统-53A",
  "微控超探发现缺陷时备注栏内注明“待复验”",
  "车统-53A装订成册，进行日小记和月累计统计",
];

const cols = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
];

const cols6 = ["G", "H", "I", "J", "K", "L"];

export const chr_53a = async () => {
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
  sheet.pageSetup.printArea = "A1:AA27";

  sheet.headerFooter.oddHeader = "&R车统-53A";
  sheet.headerFooter.evenHeader = "&R车统-53A";
  sheet.headerFooter.oddFooter = "第 &P 页，共 &N 页";
  sheet.headerFooter.evenFooter = "第 &P 页，共 &N 页";

  sheet.mergeCells("A1:N1");
  const cellA1 = sheet.getCell("A1");
  cellA1.value = "铁路货车轮轴（轮对、车轴、车轮）超声波（磁粉）探伤记录";
  cellA1.font = { name: "宋体", size: 14, bold: true };
  cellA1.alignment = alignCenter;

  sheet.mergeCells("A3:D3");
  const cellA3 = sheet.getCell("A3");
  cellA3.value = "单位名称: ";
  cellA3.font = { name: "宋体", size: 12 };

  sheet.mergeCells("E3:F3");
  const cellE3 = sheet.getCell("E3");
  cellE3.value = "探伤方法: 微控超探";
  cellE3.font = { underline: true, name: "宋体", size: 12 };

  sheet.mergeCells("G3:I3");
  const cellG3 = sheet.getCell("G3");
  cellG3.value = "探伤性质: 初探";
  cellG3.font = { name: "宋体", size: 12 };

  sheet.mergeCells("J3:L3");
  const cellJ3 = sheet.getCell("J3");
  cellJ3.value = "探伤者: ";
  cellJ3.font = { name: "宋体", size: 12 };

  const cellN3 = sheet.getCell("N3");
  cellN3.value = new Date().toLocaleDateString();

  sheet.mergeCells("A5:A7");
  const cellA5 = sheet.getCell("A5");
  cellA5.value = "序\n号";
  cellA5.font = { name: "宋体", size: 12 };
  cellA5.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA5.border = border4;

  sheet.mergeCells("B5:B7");
  const cellB5 = sheet.getCell("B5");
  cellB5.value = "轴型";
  cellB5.font = { name: "宋体", size: 12 };
  cellB5.alignment = alignCenter;
  cellB5.border = border4;

  sheet.mergeCells("C5:C7");
  const cellC5 = sheet.getCell("C5");
  cellC5.value = "轴号";
  cellC5.font = { name: "宋体", size: 12 };
  cellC5.alignment = alignCenter;
  cellC5.border = border4;

  sheet.mergeCells("D5:D7");
  const cellD5 = sheet.getCell("D5");
  cellD5.value = "轮型";
  cellD5.font = { name: "宋体", size: 12 };
  cellD5.alignment = alignCenter;
  cellD5.border = border4;

  sheet.mergeCells("E5:F6");
  const cellE5 = sheet.getCell("E5");
  cellE5.value = "轮对首次组装";
  cellE5.alignment = alignCenter;
  cellE5.font = { name: "宋体", size: 12 };
  cellE5.border = border4;

  sheet.mergeCells("G5:L5");
  const cellG5 = sheet.getCell("G5");
  cellG5.value = "探测部位";
  cellG5.alignment = alignCenter;
  cellG5.font = { name: "宋体", size: 12 };
  cellG5.border = border4;

  sheet.mergeCells("M5:M7");
  const cellM5 = sheet.getCell("M5");
  cellM5.value = "探测\n部位";
  cellM5.alignment = { ...alignCenter, wrapText: true };
  cellM5.font = { name: "宋体", size: 12 };
  cellM5.border = border4;

  sheet.mergeCells("N5:N7");
  const cellN5 = sheet.getCell("N5");
  cellN5.value = "备注";
  cellN5.alignment = alignCenter;
  cellN5.font = { name: "宋体", size: 12 };
  cellN5.border = border4;

  sheet.mergeCells("G6:H6");
  const cellG6 = sheet.getCell("G6");
  cellG6.value = "①";
  cellG6.alignment = alignCenter;
  cellG6.font = { name: "宋体", size: 12 };
  cellG6.border = border4;

  sheet.mergeCells("I6:J6");
  const cellI6 = sheet.getCell("I6");
  cellI6.value = "②";
  cellI6.alignment = alignCenter;
  cellI6.font = { name: "宋体", size: 12 };
  cellI6.border = border4;

  sheet.mergeCells("K6:L6");
  const cellK6 = sheet.getCell("K6");
  cellK6.value = "③";
  cellK6.alignment = alignCenter;
  cellK6.font = { name: "宋体", size: 12 };
  cellK6.border = border4;

  const cellE7 = sheet.getCell("E7");
  cellE7.value = "时间";
  cellE7.alignment = alignCenter;
  cellE7.font = { name: "宋体", size: 12 };
  cellE7.border = border4;

  const cellF7 = sheet.getCell("F7");
  cellF7.value = "单位";
  cellF7.alignment = alignCenter;
  cellF7.font = { name: "宋体", size: 12 };
  cellF7.border = border4;

  cols6.forEach((col, idx) => {
    const cell = sheet.getCell(`${col}7`);
    cell.value = idx % 2 === 0 ? "左" : "右";
    cell.alignment = alignCenter;
    cell.font = { name: "宋体", size: 12 };
    cell.border = border4;
  });

  for (let i = 8; i < 38; i++) {
    cols.forEach((col) => {
      const cell = sheet.getCell(`${col + i}`);
      cell.border = border4;
    });
  }

  for (let i = 38; i < 47; i++) {
    const idx = i - 37;
    const cell = sheet.getCell(`A${i}`);
    cell.alignment = alignCenter;

    switch (i) {
      case 38:
      case 39:
        cell.value = `${idx}.`;
        break;
      case 40:
        break;
      case 41:
        cell.value = `${idx - 1}.`;
        break;
      case 42:
        break;
      default:
        cell.value = `${idx - 2}.`;
    }

    sheet.mergeCells(`B${i}:N${i}`);
    const cell2 = sheet.getCell(`B${i}`);
    cell2.value = inspectionItems[idx - 1];
    cell2.font = { name: "宋体", size: 10 };
    cell2.alignment = { vertical: "middle", horizontal: "left" };
  }

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

  // const imageId = workbook.addImage({
  //   filename: "C:\\Users\\yangl\\Pictures\\1748273315214.png",
  //   extension: "png",
  // });
  // sheet.addImage(
  //   imageId,

  //   "A48:O48",
  // );

  if (import.meta.env.PROD) {
    await sheet.protect("123456", { formatColumns: true, formatRows: true });
  }
  const outputPath = join(app.getPath("temp"), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  await shell.openPath(outputPath);
};
