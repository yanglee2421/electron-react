import { ipcMain, app } from "electron/main";
import { shell } from "electron/common";
import { join } from "node:path";
import Excel from "exceljs";
import { withLog } from "./lib";

const calcHeight = (num: number) => (num / 2) * 3;
const calcWidth = (num: number) => num + 0.64;

const rowHeights = [
  15, 51.8, 39.8, 35.3, 28.5, 26.3, 23.3, 18.8, 18.8, 18, 18.8, 18.8, 18.8,
  18.8, 18.8, 18.8, 18.8, 18.8, 18.8, 18.8, 18.8, 18.8, 21, 21, 20.3, 21, 14.3,
  54.8,
];

const columnWidths = [
  7.92, 8.75, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 7,
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

const typography = {
  name: "宋体",
  size: 10,
  bold: false,
  underline: false,
} as const;

export const quartor = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  sheet.mergeCells("A1:AA1");
  const cellA1 = sheet.getCell("A1");
  cellA1.value = "辆货统-502";
  cellA1.alignment = {
    vertical: "middle",
    horizontal: "right",
    wrapText: true,
  };

  sheet.mergeCells("A2:AA2");
  const cellA2 = sheet.getCell("A2");
  cellA2.value = "单位名称：";
  cellA2.value = "铁路货车轮轴B/C型显示超声波自动探伤系统季度性能校验记录";
  cellA2.font = { name: "宋体", size: 16, bold: true };
  cellA2.alignment = alignCenter;

  sheet.mergeCells("A3:B3");
  const cellA3 = sheet.getCell("A3");
  cellA3.value = "单位名称：";
  cellA3.font = { name: "宋体", size: 10, bold: false };
  cellA3.alignment = alignCenter;
  cellA3.border = border4;

  sheet.mergeCells("C3:N3");
  const cellC3 = sheet.getCell("C3");
  cellC3.value = "武汉江岸车辆段武南轮厂检修车间";
  cellC3.font = { name: "宋体", size: 10, bold: true, underline: true };
  cellC3.alignment = alignCenter;
  cellC3.border = border4;

  sheet.mergeCells("O3:R3");
  const cellO3 = sheet.getCell("O3:R3");
  cellO3.border = border4;

  sheet.mergeCells("S3:V3");
  const cellS3 = sheet.getCell("S3");
  cellS3.value = "检验时间：";
  cellS3.font = { name: "宋体", size: 10, bold: true };
  cellS3.alignment = alignCenter;
  cellS3.border = border4;

  sheet.mergeCells("W3:AA3");
  const cellW3 = sheet.getCell("W3:AA3");
  cellW3.value = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  cellW3.font = { name: "宋体", size: 10, bold: true, underline: true };
  cellW3.alignment = alignCenter;
  cellW3.border = border4;

  const cellA4 = sheet.getCell("A4");
  cellA4.value = "设备编号";
  cellA4.font = typography;
  cellA4.alignment = alignCenter;
  cellA4.border = border4;

  const cellB4 = sheet.getCell("B4");
  cellB4.value = "";
  cellB4.font = typography;
  cellB4.alignment = alignCenter;
  cellB4.border = border4;

  sheet.mergeCells("C4:F4");
  const cellC4 = sheet.getCell("C4");
  cellC4.value = "制造时间";
  cellC4.font = typography;
  cellC4.alignment = alignCenter;
  cellC4.border = border4;

  sheet.mergeCells("G4:J4");
  const cellG4 = sheet.getCell("G4");
  cellG4.value = "";
  cellG4.font = typography;
  cellG4.alignment = alignCenter;
  cellG4.border = border4;

  sheet.mergeCells("K4:N4");
  const cellK4 = sheet.getCell("K4");
  cellK4.value = "制造单位";
  cellK4.font = typography;
  cellK4.alignment = alignCenter;
  cellK4.border = border4;

  sheet.mergeCells("O4:R4");
  const cellO4 = sheet.getCell("O4");
  cellO4.value = "";
  cellO4.font = typography;
  cellO4.alignment = alignCenter;
  cellO4.border = border4;

  sheet.mergeCells("S4:V4");
  const cellS4 = sheet.getCell("S4");
  cellS4.value = "上次检修时间";
  cellS4.font = typography;
  cellS4.alignment = alignCenter;
  cellS4.border = border4;

  sheet.mergeCells("W4:AA4");
  const cellW4 = sheet.getCell("W4:AA4");
  cellW4.value = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  cellW4.font = typography;
  cellW4.alignment = alignCenter;
  cellW4.border = border4;

  sheet.mergeCells("A5:B7");
  const cellA5 = sheet.getCell("A5");
  cellA5.value = "通道";
  cellA5.font = typography;
  cellA5.alignment = alignCenter;
  cellA5.border = border4;

  sheet.mergeCells("C5:Z5");
  const cellC5 = sheet.getCell("C5");
  cellC5.value = "反射波高(dB)";
  cellC5.font = typography;
  cellC5.alignment = alignCenter;
  cellC5.border = border4;

  const cellAA5 = sheet.getCell("AA5");
  cellAA5.value = "";
  cellAA5.font = typography;
  cellAA5.alignment = alignCenter;
  cellAA5.border = border4;

  sheet.mergeCells("C6:F6");
  const cellC6 = sheet.getCell("C6");
  cellC6.value = "第一次";
  cellC6.font = typography;
  cellC6.alignment = alignCenter;
  cellC6.border = border4;

  sheet.mergeCells("G6:J6");
  const cellG6 = sheet.getCell("G6");
  cellG6.value = "第二次";
  cellG6.font = typography;
  cellG6.alignment = alignCenter;
  cellG6.border = border4;

  sheet.mergeCells("K6:N6");
  const cellK6 = sheet.getCell("K6");
  cellK6.value = "第三次";
  cellK6.font = typography;
  cellK6.alignment = alignCenter;
  cellK6.border = border4;

  sheet.mergeCells("O6:R6");
  const cellO6 = sheet.getCell("O6");
  cellO6.value = "第四次";
  cellO6.font = typography;
  cellO6.alignment = alignCenter;
  cellO6.border = border4;

  sheet.mergeCells("S6:V6");
  const cellS6 = sheet.getCell("S6");
  cellS6.value = "第五次";
  cellS6.font = typography;
  cellS6.alignment = alignCenter;
  cellS6.border = border4;

  sheet.mergeCells("W6:Z6");
  const cellW6 = sheet.getCell("W6");
  cellW6.value = "最大差值(dB)";
  cellW6.font = typography;
  cellW6.alignment = alignCenter;
  cellW6.border = border4;

  const cellAA6 = sheet.getCell("AA6");
  cellAA6.value = "结果评定";
  cellAA6.font = typography;
  cellAA6.alignment = alignCenter;
  cellAA6.border = border4;

  sheet.mergeCells("C7:D7");
  const cellC7 = sheet.getCell("C7");
  cellC7.value = "左";
  cellC7.font = typography;
  cellC7.alignment = alignCenter;
  cellC7.border = border4;

  sheet.mergeCells("E7:F7");
  const cellE7 = sheet.getCell("E7");
  cellE7.value = "右";
  cellE7.font = typography;
  cellE7.alignment = alignCenter;
  cellE7.border = border4;

  sheet.mergeCells("G7:H7");
  const cellG7 = sheet.getCell("G7");
  cellG7.value = "左";
  cellG7.font = typography;
  cellG7.alignment = alignCenter;
  cellG7.border = border4;

  sheet.mergeCells("I7:J7");
  const cellI7 = sheet.getCell("I7");
  cellI7.value = "右";
  cellI7.font = typography;
  cellI7.alignment = alignCenter;
  cellI7.border = border4;

  sheet.mergeCells("K7:L7");
  const cellK7 = sheet.getCell("K7");
  cellK7.value = "左";
  cellK7.font = typography;
  cellK7.alignment = alignCenter;
  cellK7.border = border4;

  sheet.mergeCells("M7:N7");
  const cellM7 = sheet.getCell("M7");
  cellM7.value = "右";
  cellM7.font = typography;
  cellM7.alignment = alignCenter;
  cellM7.border = border4;

  sheet.mergeCells("O7:P7");
  const cellO7 = sheet.getCell("O7");
  cellO7.value = "左";
  cellO7.font = typography;
  cellO7.alignment = alignCenter;
  cellO7.border = border4;

  sheet.mergeCells("Q7:R7");
  const cellQ7 = sheet.getCell("Q7");
  cellQ7.value = "右";
  cellQ7.font = typography;
  cellQ7.alignment = alignCenter;
  cellQ7.border = border4;

  sheet.mergeCells("S7:T7");
  const cellS7 = sheet.getCell("S7");
  cellS7.value = "左";
  cellS7.font = typography;
  cellS7.alignment = alignCenter;
  cellS7.border = border4;

  sheet.mergeCells("U7:V7");
  const cellU7 = sheet.getCell("U7");
  cellU7.value = "右";
  cellU7.font = typography;
  cellU7.alignment = alignCenter;
  cellU7.border = border4;

  sheet.mergeCells("W7:X7");
  const cellW7 = sheet.getCell("W7");
  cellW7.value = "左";
  cellW7.font = typography;
  cellW7.alignment = alignCenter;
  cellW7.border = border4;

  sheet.mergeCells("Y7:Z7");
  const cellY7 = sheet.getCell("Y7");
  cellY7.value = "右";
  cellY7.font = typography;
  cellY7.alignment = alignCenter;
  cellY7.border = border4;

  const cellAA7 = sheet.getCell("AA7");
  cellAA7.value = "";
  cellAA7.font = typography;
  cellAA7.alignment = alignCenter;
  cellAA7.border = border4;

  sheet.mergeCells("A8:A9");
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

  sheet.mergeCells("C8:D8");
  const cellC8 = sheet.getCell("C8");
  cellC8.value = "";
  cellC8.font = typography;
  cellC8.alignment = alignCenter;
  cellC8.border = border4;

  sheet.mergeCells("E8:F8");
  const cellE8 = sheet.getCell("E8");
  cellE8.value = "";
  cellE8.font = typography;
  cellE8.alignment = alignCenter;
  cellE8.border = border4;

  sheet.mergeCells("G8:H8");
  const cellG8 = sheet.getCell("G8");
  cellG8.value = "";
  cellG8.font = typography;
  cellG8.alignment = alignCenter;
  cellG8.border = border4;

  sheet.mergeCells("I8:J8");
  const cellI8 = sheet.getCell("I8");
  cellI8.value = "";
  cellI8.font = typography;
  cellI8.alignment = alignCenter;
  cellI8.border = border4;

  sheet.mergeCells("K8:L8");
  const cellK8 = sheet.getCell("K8");
  cellK8.value = "";
  cellK8.font = typography;
  cellK8.alignment = alignCenter;
  cellK8.border = border4;

  sheet.mergeCells("M8:N8");
  const cellM8 = sheet.getCell("M8");
  cellM8.value = "";
  cellM8.font = typography;
  cellM8.alignment = alignCenter;
  cellM8.border = border4;

  sheet.mergeCells("O8:P8");
  const cellO8 = sheet.getCell("O8");
  cellO8.value = "";
  cellO8.font = typography;
  cellO8.alignment = alignCenter;
  cellO8.border = border4;

  sheet.mergeCells("Q8:R8");
  const cellQ8 = sheet.getCell("Q8");
  cellQ8.value = "";
  cellQ8.font = typography;
  cellQ8.alignment = alignCenter;
  cellQ8.border = border4;

  sheet.mergeCells("S8:T8");
  const cellS8 = sheet.getCell("S8");
  cellS8.value = "";
  cellS8.font = typography;
  cellS8.alignment = alignCenter;
  cellS8.border = border4;

  sheet.mergeCells("U8:V8");
  const cellU8 = sheet.getCell("U8");
  cellU8.value = "";
  cellU8.font = typography;
  cellU8.alignment = alignCenter;
  cellU8.border = border4;

  sheet.mergeCells("W8:X8");
  const cellW8 = sheet.getCell("W8");
  cellW8.value = "";
  cellW8.font = typography;
  cellW8.alignment = alignCenter;
  cellW8.border = border4;

  sheet.mergeCells("Y8:Z8");
  const cellY8 = sheet.getCell("Y8");
  cellY8.value = "";
  cellY8.font = typography;
  cellY8.alignment = alignCenter;
  cellY8.border = border4;

  const cellAA8 = sheet.getCell("AA8");
  cellAA8.value = "";
  cellAA8.font = typography;
  cellAA8.alignment = alignCenter;
  cellAA8.border = border4;

  const cellB9 = sheet.getCell("B9");
  cellB9.value = "2";
  cellB9.font = typography;
  cellB9.alignment = alignCenter;
  cellB9.border = border4;

  sheet.mergeCells("C9:D9");
  const cellC9 = sheet.getCell("C9");
  cellC9.value = "";
  cellC9.font = typography;
  cellC9.alignment = alignCenter;
  cellC9.border = border4;

  sheet.mergeCells("E9:F9");
  const cellE9 = sheet.getCell("E9");
  cellE9.value = "";
  cellE9.font = typography;
  cellE9.alignment = alignCenter;
  cellE9.border = border4;

  sheet.mergeCells("G9:H9");
  const cellG9 = sheet.getCell("G9");
  cellG9.value = "";
  cellG9.font = typography;
  cellG9.alignment = alignCenter;
  cellG9.border = border4;

  sheet.mergeCells("I9:J9");
  const cellI9 = sheet.getCell("I9");
  cellI9.value = "";
  cellI9.font = typography;
  cellI9.alignment = alignCenter;
  cellI9.border = border4;

  sheet.mergeCells("K9:L9");
  const cellK9 = sheet.getCell("K9");
  cellK9.value = "";
  cellK9.font = typography;
  cellK9.alignment = alignCenter;
  cellK9.border = border4;

  sheet.mergeCells("M9:N9");
  const cellM9 = sheet.getCell("M9");
  cellM9.value = "";
  cellM9.font = typography;
  cellM9.alignment = alignCenter;
  cellM9.border = border4;

  sheet.mergeCells("O9:P9");
  const cellO9 = sheet.getCell("O9");
  cellO9.value = "";
  cellO9.font = typography;
  cellO9.alignment = alignCenter;
  cellO9.border = border4;

  sheet.mergeCells("Q9:R9");
  const cellQ9 = sheet.getCell("Q9");
  cellQ9.value = "";
  cellQ9.font = typography;
  cellQ9.alignment = alignCenter;
  cellQ9.border = border4;

  sheet.mergeCells("S9:T9");
  const cellS9 = sheet.getCell("S9");
  cellS9.value = "";
  cellS9.font = typography;
  cellS9.alignment = alignCenter;
  cellS9.border = border4;

  sheet.mergeCells("U9:V9");
  const cellU9 = sheet.getCell("U9");
  cellU9.value = "";
  cellU9.font = typography;
  cellU9.alignment = alignCenter;
  cellU9.border = border4;

  sheet.mergeCells("W9:X9");
  const cellW9 = sheet.getCell("W9");
  cellW9.value = "";
  cellW9.font = typography;
  cellW9.alignment = alignCenter;
  cellW9.border = border4;

  sheet.mergeCells("Y9:Z9");
  const cellY9 = sheet.getCell("Y9");
  cellY9.value = "";
  cellY9.font = typography;
  cellY9.alignment = alignCenter;
  cellY9.border = border4;

  const cellAA9 = sheet.getCell("AA9");
  cellAA9.value = "";
  cellAA9.font = typography;
  cellAA9.alignment = alignCenter;
  cellAA9.border = border4;

  sheet.mergeCells("A10:A21");
  const cellA10 = sheet.getCell("A10");
  cellA10.value = "轮\n座\n镶\n入\n部";
  cellA10.font = typography;
  cellA10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA10.border = border4;

  const cellB10 = sheet.getCell("B10");
  cellB10.value = "1";
  cellB10.font = typography;
  cellB10.alignment = alignCenter;
  cellB10.border = border4;

  sheet.mergeCells("C10:D10");
  const cellC10 = sheet.getCell("C10");
  cellC10.value = "";
  cellC10.font = typography;
  cellC10.alignment = alignCenter;
  cellC10.border = border4;

  sheet.mergeCells("E10:F10");
  const cellE10 = sheet.getCell("E10");
  cellE10.value = "";
  cellE10.font = typography;
  cellE10.alignment = alignCenter;
  cellE10.border = border4;

  sheet.mergeCells("G10:H10");
  const cellG10 = sheet.getCell("G10");
  cellG10.value = "";
  cellG10.font = typography;
  cellG10.alignment = alignCenter;
  cellG10.border = border4;

  sheet.mergeCells("I10:J10");
  const cellI10 = sheet.getCell("I10");
  cellI10.value = "";
  cellI10.font = typography;
  cellI10.alignment = alignCenter;
  cellI10.border = border4;

  sheet.mergeCells("K10:L10");
  const cellK10 = sheet.getCell("K10");
  cellK10.value = "";
  cellK10.font = typography;
  cellK10.alignment = alignCenter;
  cellK10.border = border4;

  sheet.mergeCells("M10:N10");
  const cellM10 = sheet.getCell("M10");
  cellM10.value = "";
  cellM10.font = typography;
  cellM10.alignment = alignCenter;
  cellM10.border = border4;

  sheet.mergeCells("O10:P10");
  const cellO10 = sheet.getCell("O10");
  cellO10.value = "";
  cellO10.font = typography;
  cellO10.alignment = alignCenter;
  cellO10.border = border4;

  sheet.mergeCells("Q10:R10");
  const cellQ10 = sheet.getCell("Q10");
  cellQ10.value = "";
  cellQ10.font = typography;
  cellQ10.alignment = alignCenter;
  cellQ10.border = border4;

  sheet.mergeCells("S10:T10");
  const cellS10 = sheet.getCell("S10");
  cellS10.value = "";
  cellS10.font = typography;
  cellS10.alignment = alignCenter;
  cellS10.border = border4;

  sheet.mergeCells("U10:V10");
  const cellU10 = sheet.getCell("U10");
  cellU10.value = "";
  cellU10.font = typography;
  cellU10.alignment = alignCenter;
  cellU10.border = border4;

  sheet.mergeCells("W10:X10");
  const cellW10 = sheet.getCell("W10");
  cellW10.value = "";
  cellW10.font = typography;
  cellW10.alignment = alignCenter;
  cellW10.border = border4;

  sheet.mergeCells("Y10:Z10");
  const cellY10 = sheet.getCell("Y10");
  cellY10.value = "";
  cellY10.font = typography;
  cellY10.alignment = alignCenter;
  cellY10.border = border4;

  const cellAA10 = sheet.getCell("AA10");
  cellAA10.value = "";
  cellAA10.font = typography;
  cellAA10.alignment = alignCenter;
  cellAA10.border = border4;

  const cellB11 = sheet.getCell("B11");
  cellB11.value = "2";
  cellB11.font = typography;
  cellB11.alignment = alignCenter;
  cellB11.border = border4;

  sheet.mergeCells("C11:D11");
  const cellC11 = sheet.getCell("C11");
  cellC11.value = "";
  cellC11.font = typography;
  cellC11.alignment = alignCenter;
  cellC11.border = border4;

  sheet.mergeCells("E11:F11");
  const cellE11 = sheet.getCell("E11");
  cellE11.value = "";
  cellE11.font = typography;
  cellE11.alignment = alignCenter;
  cellE11.border = border4;

  sheet.mergeCells("G11:H11");
  const cellG11 = sheet.getCell("G11");
  cellG11.value = "";
  cellG11.font = typography;
  cellG11.alignment = alignCenter;
  cellG11.border = border4;

  sheet.mergeCells("I11:J11");
  const cellI11 = sheet.getCell("I11");
  cellI11.value = "";
  cellI11.font = typography;
  cellI11.alignment = alignCenter;
  cellI11.border = border4;

  sheet.mergeCells("K11:L11");
  const cellK11 = sheet.getCell("K11");
  cellK11.value = "";
  cellK11.font = typography;
  cellK11.alignment = alignCenter;
  cellK11.border = border4;

  sheet.mergeCells("M11:N11");
  const cellM11 = sheet.getCell("M11");
  cellM11.value = "";
  cellM11.font = typography;
  cellM11.alignment = alignCenter;
  cellM11.border = border4;

  sheet.mergeCells("O11:P11");
  const cellO11 = sheet.getCell("O11");
  cellO11.value = "";
  cellO11.font = typography;
  cellO11.alignment = alignCenter;
  cellO11.border = border4;

  sheet.mergeCells("Q11:R11");
  const cellQ11 = sheet.getCell("Q11");
  cellQ11.value = "";
  cellQ11.font = typography;
  cellQ11.alignment = alignCenter;
  cellQ11.border = border4;

  sheet.mergeCells("S11:T11");
  const cellS11 = sheet.getCell("S11");
  cellS11.value = "";
  cellS11.font = typography;
  cellS11.alignment = alignCenter;
  cellS11.border = border4;

  sheet.mergeCells("U11:V11");
  const cellU11 = sheet.getCell("U11");
  cellU11.value = "";
  cellU11.font = typography;
  cellU11.alignment = alignCenter;
  cellU11.border = border4;

  sheet.mergeCells("W11:X11");
  const cellW11 = sheet.getCell("W11");
  cellW11.value = "";
  cellW11.font = typography;
  cellW11.alignment = alignCenter;
  cellW11.border = border4;

  sheet.mergeCells("Y11:Z11");
  const cellY11 = sheet.getCell("Y11");
  cellY11.value = "";
  cellY11.font = typography;
  cellY11.alignment = alignCenter;
  cellY11.border = border4;

  const cellAA11 = sheet.getCell("AA11");
  cellAA11.value = "";
  cellAA11.font = typography;
  cellAA11.alignment = alignCenter;
  cellAA11.border = border4;

  const cellB12 = sheet.getCell("B12");
  cellB12.value = "";
  cellB12.font = typography;
  cellB12.alignment = alignCenter;
  cellB12.border = border4;

  sheet.mergeCells("C12:D12");
  const cellC12 = sheet.getCell("C12");
  cellC12.value = "";
  cellC12.font = typography;
  cellC12.alignment = alignCenter;
  cellC12.border = border4;

  sheet.mergeCells("E12:F12");
  const cellE12 = sheet.getCell("E12");
  cellE12.value = "";
  cellE12.font = typography;
  cellE12.alignment = alignCenter;
  cellE12.border = border4;

  sheet.mergeCells("G12:H12");
  const cellG12 = sheet.getCell("G12");
  cellG12.value = "";
  cellG12.font = typography;
  cellG12.alignment = alignCenter;
  cellG12.border = border4;

  sheet.mergeCells("I12:J12");
  const cellI12 = sheet.getCell("I12");
  cellI12.value = "";
  cellI12.font = typography;
  cellI12.alignment = alignCenter;
  cellI12.border = border4;

  sheet.mergeCells("K12:L12");
  const cellK12 = sheet.getCell("K12");
  cellK12.value = "";
  cellK12.font = typography;
  cellK12.alignment = alignCenter;
  cellK12.border = border4;

  sheet.mergeCells("M12:N12");
  const cellM12 = sheet.getCell("M12");
  cellM12.value = "";
  cellM12.font = typography;
  cellM12.alignment = alignCenter;
  cellM12.border = border4;

  sheet.mergeCells("O12:P12");
  const cellO12 = sheet.getCell("O12");
  cellO12.value = "";
  cellO12.font = typography;
  cellO12.alignment = alignCenter;
  cellO12.border = border4;

  sheet.mergeCells("Q12:R12");
  const cellQ12 = sheet.getCell("Q12");
  cellQ12.value = "";
  cellQ12.font = typography;
  cellQ12.alignment = alignCenter;
  cellQ12.border = border4;

  sheet.mergeCells("S12:T12");
  const cellS12 = sheet.getCell("S12");
  cellS12.value = "";
  cellS12.font = typography;
  cellS12.alignment = alignCenter;
  cellS12.border = border4;

  sheet.mergeCells("U12:V12");
  const cellU12 = sheet.getCell("U12");
  cellU12.value = "";
  cellU12.font = typography;
  cellU12.alignment = alignCenter;
  cellU12.border = border4;

  sheet.mergeCells("W12:X12");
  const cellW12 = sheet.getCell("W12");
  cellW12.value = "";
  cellW12.font = typography;
  cellW12.alignment = alignCenter;
  cellW12.border = border4;

  sheet.mergeCells("Y12:Z12");
  const cellY12 = sheet.getCell("Y12");
  cellY12.value = "";
  cellY12.font = typography;
  cellY12.alignment = alignCenter;
  cellY12.border = border4;

  const cellAA12 = sheet.getCell("AA12");
  cellAA12.value = "";
  cellAA12.font = typography;
  cellAA12.alignment = alignCenter;
  cellAA12.border = border4;

  for (let i = 13; i <= 21; i++) {
    const cellB = sheet.getCell(`B${i}`);
    cellB.value = "";
    cellB.font = typography;
    cellB.alignment = alignCenter;
    cellB.border = border4;

    ["C", "E", "G", "I", "K", "M", "O", "Q", "S", "U", "W", "Y"].forEach(
      (col) => {
        const startCol = col;
        const endCol = String.fromCharCode(col.charCodeAt(0) + 1);
        sheet.mergeCells(`${startCol}${i}:${endCol}${i}`);
        const cell = sheet.getCell(`${startCol}${i}`);
        cell.value = "";
        cell.font = typography;
        cell.alignment = alignCenter;
        cell.border = border4;
      },
    );

    const cellAA = sheet.getCell(`AA${i}`);
    cellAA.value = "";
    cellAA.font = typography;
    cellAA.alignment = alignCenter;
    cellAA.border = border4;
  }

  const cellA22 = sheet.getCell("A22");
  cellA22.value = "全轴穿透";
  cellA22.font = typography;
  cellA22.alignment = alignCenter;
  cellA22.border = border4;

  const cellB22 = sheet.getCell("B22");
  cellB22.value = "1";
  cellB22.font = typography;
  cellB22.alignment = alignCenter;
  cellB22.border = border4;

  sheet.mergeCells("C22:D22");
  const cellC22 = sheet.getCell("C22");
  cellC22.value = "";
  cellC22.font = typography;
  cellC22.alignment = alignCenter;
  cellC22.border = border4;

  sheet.mergeCells("E22:F22");
  const cellE22 = sheet.getCell("E22");
  cellE22.value = "";
  cellE22.font = typography;
  cellE22.alignment = alignCenter;
  cellE22.border = border4;

  sheet.mergeCells("G22:H22");
  const cellG22 = sheet.getCell("G22");
  cellG22.value = "";
  cellG22.font = typography;
  cellG22.alignment = alignCenter;
  cellG22.border = border4;

  sheet.mergeCells("I22:J22");
  const cellI22 = sheet.getCell("I22");
  cellI22.value = "";
  cellI22.font = typography;
  cellI22.alignment = alignCenter;
  cellI22.border = border4;

  sheet.mergeCells("K22:L22");
  const cellK22 = sheet.getCell("K22");
  cellK22.value = "";
  cellK22.font = typography;
  cellK22.alignment = alignCenter;
  cellK22.border = border4;

  sheet.mergeCells("M22:N22");
  const cellM22 = sheet.getCell("M22");
  cellM22.value = "";
  cellM22.font = typography;
  cellM22.alignment = alignCenter;
  cellM22.border = border4;

  sheet.mergeCells("O22:P22");
  const cellO22 = sheet.getCell("O22");
  cellO22.value = "";
  cellO22.font = typography;
  cellO22.alignment = alignCenter;
  cellO22.border = border4;

  sheet.mergeCells("Q22:R22");
  const cellQ22 = sheet.getCell("Q22");
  cellQ22.value = "";
  cellQ22.font = typography;
  cellQ22.alignment = alignCenter;
  cellQ22.border = border4;

  sheet.mergeCells("S22:T22");
  const cellS22 = sheet.getCell("S22");
  cellS22.value = "";
  cellS22.font = typography;
  cellS22.alignment = alignCenter;
  cellS22.border = border4;

  sheet.mergeCells("U22:V22");
  const cellU22 = sheet.getCell("U22");
  cellU22.value = "";
  cellU22.font = typography;
  cellU22.alignment = alignCenter;
  cellU22.border = border4;

  sheet.mergeCells("W22:X22");
  const cellW22 = sheet.getCell("W22");
  cellW22.value = "";
  cellW22.font = typography;
  cellW22.alignment = alignCenter;
  cellW22.border = border4;

  sheet.mergeCells("Y22:Z22");
  const cellY22 = sheet.getCell("Y22");
  cellY22.value = "";
  cellY22.font = typography;
  cellY22.alignment = alignCenter;
  cellY22.border = border4;

  const cellAA22 = sheet.getCell("AA22");
  cellAA22.value = "";
  cellAA22.font = typography;
  cellAA22.alignment = alignCenter;
  cellAA22.border = border4;

  sheet.mergeCells("A23:A26");
  const cellA23 = sheet.getCell("A23");
  cellA23.value = "参加\n人员\n签章";
  cellA23.font = typography;
  cellA23.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA23.border = border4;

  sheet.mergeCells("B23:D24");
  const cellB23 = sheet.getCell("B23");
  cellB23.value = "探伤工";
  cellB23.font = typography;
  cellB23.alignment = alignCenter;
  cellB23.border = border4;

  sheet.mergeCells("E23:H24");
  const cellE23 = sheet.getCell("E23");
  cellE23.value = "";
  cellE23.font = typography;
  cellE23.alignment = alignCenter;
  cellE23.border = border4;

  sheet.mergeCells("I23:K24");
  const cellI23 = sheet.getCell("I23");
  cellI23.value = "探伤工长";
  cellI23.font = typography;
  cellI23.alignment = alignCenter;
  cellI23.border = border4;

  sheet.mergeCells("L23:O24");
  const cellL23 = sheet.getCell("L23");
  cellL23.value = "";
  cellL23.font = typography;
  cellL23.alignment = alignCenter;
  cellL23.border = border4;

  sheet.mergeCells("P23:R24");
  const cellP23 = sheet.getCell("P23");
  cellP23.value = "质检员";
  cellP23.font = typography;
  cellP23.alignment = alignCenter;
  cellP23.border = border4;

  sheet.mergeCells("S23:V24");
  const cellS23 = sheet.getCell("S23");
  cellS23.value = "";
  cellS23.font = typography;
  cellS23.alignment = alignCenter;
  cellS23.border = border4;

  sheet.mergeCells("W23:Y24");
  const cellW23 = sheet.getCell("W23");
  cellW23.value = "验收员";
  cellW23.font = typography;
  cellW23.alignment = alignCenter;
  cellW23.border = border4;

  sheet.mergeCells("Z23:AA24");
  const cellZ23 = sheet.getCell("Z23");
  cellZ23.value = "";
  cellZ23.font = typography;
  cellZ23.alignment = alignCenter;
  cellZ23.border = border4;

  sheet.mergeCells("B25:D26");
  const cellB25 = sheet.getCell("B25");
  cellB25.value = "设备维修工";
  cellB25.font = typography;
  cellB25.alignment = alignCenter;
  cellB25.border = border4;

  sheet.mergeCells("E25:H26");
  const cellE25 = sheet.getCell("E25");
  cellE25.value = "";
  cellE25.font = typography;
  cellE25.alignment = alignCenter;
  cellE25.border = border4;

  sheet.mergeCells("I25:K26");
  const cellI25 = sheet.getCell("I25");
  cellI25.value = "轮轴专职";
  cellI25.font = typography;
  cellI25.alignment = alignCenter;
  cellI25.border = border4;

  sheet.mergeCells("L25:O26");
  const cellL25 = sheet.getCell("L25");
  cellL25.value = "";
  cellL25.font = typography;
  cellL25.alignment = alignCenter;
  cellL25.border = border4;

  sheet.mergeCells("P25:R26");
  const cellP25 = sheet.getCell("P25");
  cellP25.value = "设备专职";
  cellP25.font = typography;
  cellP25.alignment = alignCenter;
  cellP25.border = border4;

  sheet.mergeCells("S25:V26");
  const cellS25 = sheet.getCell("S25");
  cellS25.value = "";
  cellS25.font = typography;
  cellS25.alignment = alignCenter;
  cellS25.border = border4;

  sheet.mergeCells("W25:Y26");
  const cellW25 = sheet.getCell("W25");
  cellW25.value = "主管领导";
  cellW25.font = typography;
  cellW25.alignment = alignCenter;
  cellW25.border = border4;

  sheet.mergeCells("Z25:AA26");
  const cellZ25 = sheet.getCell("Z25");
  cellZ25.value = "";
  cellZ25.font = typography;
  cellZ25.alignment = alignCenter;
  cellZ25.border = border4;

  sheet.mergeCells("A27:D27");
  const cellA27 = sheet.getCell("A27");
  cellA27.value = "备注";
  cellA27.font = { name: "宋体", size: 12, bold: false };
  cellA27.alignment = alignCenter;
  cellA27.border = border4;

  sheet.mergeCells("E27:AA27");
  const cellE27 = sheet.getCell("E27");
  cellE27.value = "";
  cellE27.font = { name: "宋体", size: 12, bold: false };
  cellE27.alignment = alignCenter;
  cellE27.border = border4;

  sheet.mergeCells("A28:AA28");
  const cellA28 = sheet.getCell("A28");
  cellA28.value =
    "注：最大差值(ΔdB)是指五次波幅测量值中最大值与最小值之差，要求ΔdB≤6dB。";
  cellA28.font = { name: "宋体", size: 12, bold: false };
  cellA28.alignment = alignCenter;

  rowHeights.forEach((rowHeight, idx) => {
    sheet.getRow(idx + 1).height = calcHeight(rowHeight);
  });

  columnWidths.forEach((columnWidth, idx) => {
    sheet.getColumn(idx + 1).width = calcWidth(columnWidth);
  });

  await sheet.protect("123456", {});
  const outputPath = join(app.getPath("documents"), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  await shell.openPath(outputPath);
};

export const initIpc = () => {
  ipcMain.handle("excel:quartor", withLog(quartor));
};
