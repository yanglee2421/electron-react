import Excel from "@yanglee2421/exceljs";
import { shell } from "electron/common";
import { app } from "electron/main";
import { join } from "node:path";

const calcColumnWidth = (width: number) => width;
const calcRowHeight = (height: number) => height;

const columnWidths = new Map([
  ["A", 1.5],
  ["B", 3.25],
  ["C", 6.5],
  ["D", 7],
  ["E", 7],
  ["F", 10],
  ["G", 10],
  ["H", 3.5],
  ["I", 3.5],
  ["J", 3.5],
  ["K", 3.5],
  ["L", 3.5],
  ["M", 3.5],
  ["N", 8],
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
  15, // 39
  15, // 40
  15, // 41
  15, // 42
  15, // 43
  15, // 44
  15, // 45
  15, // 46
];

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
  "O",
];

const cols6 = ["H", "I", "J", "K", "L", "M"];

export const chr_53a = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 8.38;
  sheet.properties.defaultRowHeight = 14.25;

  sheet.mergeCells("B1:O1");
  const cellB1 = sheet.getCell("B1");
  cellB1.value = "车统-53A";
  cellB1.font = { name: "宋体", size: 11, bold: false };
  cellB1.alignment = {
    vertical: "middle",
    horizontal: "right",
    wrapText: false,
  };

  sheet.mergeCells("B2:O2");
  const cellB2 = sheet.getCell("B2");
  cellB2.value = "铁路货车轮轴（轮对、车轴、车轮）超声波（磁粉）探伤记录";
  cellB2.font = { name: "宋体", size: 14, bold: true };
  cellB2.alignment = alignCenter;
  sheet.mergeCells("B6:B8");
  const cellB6 = sheet.getCell("B6");
  cellB6.value = "顺\n号";
  cellB6.font = { name: "宋体", size: 12 };
  cellB6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellB6.border = border4;

  sheet.mergeCells("C6:C8");
  const cellC6 = sheet.getCell("C6");
  cellC6.value = "轴型";
  cellC6.font = { name: "宋体", size: 12 };
  cellC6.alignment = alignCenter;
  cellC6.border = border4;

  sheet.mergeCells("D6:D8");
  const cellD6 = sheet.getCell("D6");
  cellD6.value = "轴号";
  cellD6.font = { name: "宋体", size: 12 };
  cellD6.alignment = alignCenter;
  cellD6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
  };

  sheet.mergeCells("E6:E8");
  const cellE6 = sheet.getCell("E6");
  cellE6.value = "轮型";
  cellE6.font = { name: "宋体", size: 12 };
  cellE6.alignment = alignCenter;
  cellE6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("F6:G7");
  const cellF6 = sheet.getCell("F6");
  cellF6.value = "轮对首次组装";
  cellF6.alignment = alignCenter;
  cellF6.font = { name: "宋体", size: 12 };
  cellF6.border = border4;

  sheet.mergeCells("H6:M6");
  const cellH6 = sheet.getCell("H6");
  cellH6.value = "探测部位";
  cellH6.alignment = alignCenter;
  cellH6.font = { name: "宋体", size: 12 };
  cellH6.border = border4;

  sheet.mergeCells("N6:N8");
  const cellN6 = sheet.getCell("N6");
  cellN6.value = "探测\n部位";
  cellN6.alignment = { ...alignCenter, wrapText: true };
  cellN6.font = { name: "宋体", size: 12 };
  cellN6.border = border4;

  sheet.mergeCells("O6:O8");
  const cellO6 = sheet.getCell("O6");
  cellO6.value = "备注";
  cellO6.alignment = alignCenter;
  cellO6.font = { name: "宋体", size: 12 };
  cellO6.border = border4;

  sheet.mergeCells("H7:I7");
  const cellH7 = sheet.getCell("H7");
  cellH7.value = "①";
  cellH7.alignment = alignCenter;
  cellH7.font = { name: "宋体", size: 12 };
  cellH7.border = border4;

  sheet.mergeCells("J7:K7");
  const cellJ7 = sheet.getCell("J7");
  cellJ7.value = "②";
  cellJ7.alignment = alignCenter;
  cellJ7.font = { name: "宋体", size: 12 };
  cellJ7.border = border4;

  sheet.mergeCells("L7:M7");
  const cellL7 = sheet.getCell("L7");
  cellL7.value = "③";
  cellL7.alignment = alignCenter;
  cellL7.font = { name: "宋体", size: 12 };
  cellL7.border = border4;

  const cellF8 = sheet.getCell("F8");
  cellF8.value = "时间";
  cellF8.alignment = alignCenter;
  cellF8.font = { name: "宋体", size: 12 };
  cellF8.border = border4;

  const cellG8 = sheet.getCell("G8");
  cellG8.value = "单位";
  cellG8.alignment = alignCenter;
  cellG8.font = { name: "宋体", size: 12 };
  cellG8.border = border4;

  cols6.forEach((col, idx) => {
    const cell = sheet.getCell(`${col}8`);
    cell.value = idx % 2 === 0 ? "左" : "右";
    cell.alignment = alignCenter;
    cell.font = { name: "宋体", size: 12 };
    cell.border = border4;
  });

  for (let i = 9; i < 39; i++) {
    cols.forEach((col) => {
      const cell = sheet.getCell(`${col + i}`);
      cell.border = border4;
    });
  }

  for (let i = 39; i < 48; i++) {
    const idx = i - 38;
    const cell = sheet.getCell(`B${i}`);
    cell.alignment = alignCenter;

    switch (i) {
      case 39:
      case 40:
        cell.value = `${idx}.`;
        break;
      case 41:
        break;
      case 42:
        cell.value = `${idx - 1}.`;
        break;
      case 43:
        break;
      default:
        cell.value = `${idx - 2}.`;
    }

    sheet.mergeCells(`C${i}:O${i}`);
    const cell2 = sheet.getCell(`C${i}`);
    cell2.value = inspectionItems[idx - 1];
    cell2.font = { name: "宋体", size: 10 };
    cell2.alignment = { vertical: "middle", horizontal: "left" };
  }

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
