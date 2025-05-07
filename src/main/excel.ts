import { ipcMain, app } from "electron/main";
import { shell } from "electron/common";
import { join } from "node:path";
import Excel from "exceljs";
import { withLog } from "./lib";

const calcHeight = (num: number) => (num / 2) * 3;
const calcWidth = (num: number) => num + 0.64;

export const quartor = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  sheet.mergeCells("A1:AA1");
  const cellA1 = sheet.getCell("A1");
  cellA1.value = "铁路货车轮轴B/C型显示超声波自动探伤系统季度性能校验记录";
  cellA1.font = { name: "宋体", size: 16, bold: true };
  cellA1.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };

  sheet.mergeCells("A2:B2");
  const cellA2 = sheet.getCell("A2");
  cellA2.value = "单位名称：";
  cellA2.font = { name: "宋体", size: 10, bold: true };
  cellA2.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA2.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C2:N2");
  const cellC2 = sheet.getCell("C2");
  cellC2.value = "武汉江岸车辆段武南轮厂检修车间";
  cellC2.font = { name: "宋体", size: 10, bold: true, underline: true };
  cellC2.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC2.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("O2:R2");
  const cellO2 = sheet.getCell("O2:R2");
  cellO2.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("S2:V2");
  const cellS2 = sheet.getCell("S2");
  cellS2.value = "检验时间：";
  cellS2.font = { name: "宋体", size: 10, bold: true };
  cellS2.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellS2.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("W2:AA2");
  const cellW2 = sheet.getCell("W2:AA2");
  cellW2.value = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  cellW2.font = { name: "宋体", size: 10, bold: true, underline: true };
  cellW2.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellW2.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellA3 = sheet.getCell("A3");
  cellA3.value = "设备编号";
  cellA3.font = { name: "宋体", size: 10, bold: false };
  cellA3.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA3.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellB3 = sheet.getCell("B3");
  cellB3.value = "";
  cellB3.font = { name: "宋体", size: 10, bold: false };
  cellB3.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellB3.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C3:F3");
  const cellC3 = sheet.getCell("C3");
  cellC3.value = "制造时间";
  cellC3.font = { name: "宋体", size: 10, bold: false };
  cellC3.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC3.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("G3:J3");
  const cellG3 = sheet.getCell("G3");
  cellG3.value = "";
  cellG3.font = { name: "宋体", size: 10, bold: false };
  cellG3.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellG3.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("K3:N3");
  const cellK3 = sheet.getCell("K3");
  cellK3.value = "制造单位";
  cellK3.font = { name: "宋体", size: 10, bold: false };
  cellK3.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellK3.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("O3:R3");
  const cellO3 = sheet.getCell("O3");
  cellO3.value = "";
  cellO3.font = { name: "宋体", size: 10, bold: false };
  cellO3.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellO3.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("S3:V3");
  const cellS3 = sheet.getCell("S3");
  cellS3.value = "上次检修时间";
  cellS3.font = { name: "宋体", size: 10, bold: false };
  cellS3.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellS3.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("W3:AA3");
  const cellW3 = sheet.getCell("W3:AA3");
  cellW3.value = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  cellW3.font = { name: "宋体", size: 10, bold: false };
  cellW3.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellW3.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("A4:B6");
  const cellA4 = sheet.getCell("A4");
  cellA4.value = "通道";
  cellA4.font = { name: "宋体", size: 10, bold: false };
  cellA4.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA4.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C4:Z4");
  const cellC4 = sheet.getCell("C4");
  cellC4.value = "反射波高（dB）";
  cellC4.font = { name: "宋体", size: 10, bold: false };
  cellC4.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC4.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellAA4 = sheet.getCell("AA4");
  cellAA4.value = "";
  cellAA4.font = { name: "宋体", size: 10, bold: false };
  cellAA4.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellAA4.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C5:F5");
  const cellC5 = sheet.getCell("C5");
  cellC5.value = "第一次";
  cellC5.font = { name: "宋体", size: 10, bold: false };
  cellC5.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC5.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("G5:J5");
  const cellG5 = sheet.getCell("G5");
  cellG5.value = "第二次";
  cellG5.font = { name: "宋体", size: 10, bold: false };
  cellG5.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellG5.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("K5:N5");
  const cellK5 = sheet.getCell("K5");
  cellK5.value = "第三次";
  cellK5.font = { name: "宋体", size: 10, bold: false };
  cellK5.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellK5.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("O5:R5");
  const cellO5 = sheet.getCell("O5");
  cellO5.value = "第四次";
  cellO5.font = { name: "宋体", size: 10, bold: false };
  cellO5.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellO5.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("S5:V5");
  const cellS5 = sheet.getCell("S5");
  cellS5.value = "第五次";
  cellS5.font = { name: "宋体", size: 10, bold: false };
  cellS5.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellS5.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("W5:Z5");
  const cellW5 = sheet.getCell("W5");
  cellW5.value = "最大差值(dB)";
  cellW5.font = { name: "宋体", size: 10, bold: false };
  cellW5.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: false,
  };
  cellW5.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellAA5 = sheet.getCell("AA5");
  cellAA5.value = "结果评定";
  cellAA5.font = { name: "宋体", size: 10, bold: false };
  cellAA5.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: false,
  };
  cellAA5.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C6:D6");
  const cellC6 = sheet.getCell("C6");
  cellC6.value = "左";
  cellC6.font = { name: "宋体", size: 10, bold: false };
  cellC6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("E6:F6");
  const cellE6 = sheet.getCell("E6");
  cellE6.value = "右";
  cellE6.font = { name: "宋体", size: 10, bold: false };
  cellE6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellE6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("G6:H6");
  const cellG6 = sheet.getCell("G6");
  cellG6.value = "左";
  cellG6.font = { name: "宋体", size: 10, bold: false };
  cellG6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellG6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("I6:J6");
  const cellI6 = sheet.getCell("I6");
  cellI6.value = "右";
  cellI6.font = { name: "宋体", size: 10, bold: false };
  cellI6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellI6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("K6:L6");
  const cellK6 = sheet.getCell("K6");
  cellK6.value = "左";
  cellK6.font = { name: "宋体", size: 10, bold: false };
  cellK6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellK6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("M6:N6");
  const cellM6 = sheet.getCell("M6");
  cellM6.value = "右";
  cellM6.font = { name: "宋体", size: 10, bold: false };
  cellM6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellM6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("O6:P6");
  const cellO6 = sheet.getCell("O6");
  cellO6.value = "左";
  cellO6.font = { name: "宋体", size: 10, bold: false };
  cellO6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellO6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Q6:R6");
  const cellQ6 = sheet.getCell("Q6");
  cellQ6.value = "右";
  cellQ6.font = { name: "宋体", size: 10, bold: false };
  cellQ6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellQ6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("S6:T6");
  const cellS6 = sheet.getCell("S6");
  cellS6.value = "左";
  cellS6.font = { name: "宋体", size: 10, bold: false };
  cellS6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellS6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("U6:V6");
  const cellU6 = sheet.getCell("U6");
  cellU6.value = "右";
  cellU6.font = { name: "宋体", size: 10, bold: false };
  cellU6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellU6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("W6:X6");
  const cellW6 = sheet.getCell("W6");
  cellW6.value = "左";
  cellW6.font = { name: "宋体", size: 10, bold: false };
  cellW6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellW6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Y6:Z6");
  const cellY6 = sheet.getCell("Y6");
  cellY6.value = "右";
  cellY6.font = { name: "宋体", size: 10, bold: false };
  cellY6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellY6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellAA6 = sheet.getCell("AA6");
  cellAA6.value = "";
  cellAA6.font = { name: "宋体", size: 10, bold: false };
  cellAA6.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellAA6.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("A7:A8");
  const cellA7 = sheet.getCell("A7");
  cellA7.value = "轴颈\n根部";
  cellA7.font = { name: "宋体", size: 10, bold: false };
  cellA7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellB7 = sheet.getCell("B7");
  cellB7.value = "1";
  cellB7.font = { name: "宋体", size: 10, bold: false };
  cellB7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellB7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C7:D7");
  const cellC7 = sheet.getCell("C7");
  cellC7.value = "";
  cellC7.font = { name: "宋体", size: 10, bold: false };
  cellC7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("E7:F7");
  const cellE7 = sheet.getCell("E7");
  cellE7.value = "";
  cellE7.font = { name: "宋体", size: 10, bold: false };
  cellE7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellE7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("G7:H7");
  const cellG7 = sheet.getCell("G7");
  cellG7.value = "";
  cellG7.font = { name: "宋体", size: 10, bold: false };
  cellG7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellG7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("I7:J7");
  const cellI7 = sheet.getCell("I7");
  cellI7.value = "";
  cellI7.font = { name: "宋体", size: 10, bold: false };
  cellI7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellI7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("K7:L7");
  const cellK7 = sheet.getCell("K7");
  cellK7.value = "";
  cellK7.font = { name: "宋体", size: 10, bold: false };
  cellK7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellK7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("M7:N7");
  const cellM7 = sheet.getCell("M7");
  cellM7.value = "";
  cellM7.font = { name: "宋体", size: 10, bold: false };
  cellM7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellM7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("O7:P7");
  const cellO7 = sheet.getCell("O7");
  cellO7.value = "";
  cellO7.font = { name: "宋体", size: 10, bold: false };
  cellO7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellO7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Q7:R7");
  const cellQ7 = sheet.getCell("Q7");
  cellQ7.value = "";
  cellQ7.font = { name: "宋体", size: 10, bold: false };
  cellQ7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellQ7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("S7:T7");
  const cellS7 = sheet.getCell("S7");
  cellS7.value = "";
  cellS7.font = { name: "宋体", size: 10, bold: false };
  cellS7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellS7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("U7:V7");
  const cellU7 = sheet.getCell("U7");
  cellU7.value = "";
  cellU7.font = { name: "宋体", size: 10, bold: false };
  cellU7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellU7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("W7:X7");
  const cellW7 = sheet.getCell("W7");
  cellW7.value = "";
  cellW7.font = { name: "宋体", size: 10, bold: false };
  cellW7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellW7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Y7:Z7");
  const cellY7 = sheet.getCell("Y7");
  cellY7.value = "";
  cellY7.font = { name: "宋体", size: 10, bold: false };
  cellY7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellY7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellAA7 = sheet.getCell("AA7");
  cellAA7.value = "";
  cellAA7.font = { name: "宋体", size: 10, bold: false };
  cellAA7.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellAA7.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellB8 = sheet.getCell("B8");
  cellB8.value = "2";
  cellB8.font = { name: "宋体", size: 10, bold: false };
  cellB8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellB8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C8:D8");
  const cellC8 = sheet.getCell("C8");
  cellC8.value = "";
  cellC8.font = { name: "宋体", size: 10, bold: false };
  cellC8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("E8:F8");
  const cellE8 = sheet.getCell("E8");
  cellE8.value = "";
  cellE8.font = { name: "宋体", size: 10, bold: false };
  cellE8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellE8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("G8:H8");
  const cellG8 = sheet.getCell("G8");
  cellG8.value = "";
  cellG8.font = { name: "宋体", size: 10, bold: false };
  cellG8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellG8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("I8:J8");
  const cellI8 = sheet.getCell("I8");
  cellI8.value = "";
  cellI8.font = { name: "宋体", size: 10, bold: false };
  cellI8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellI8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("K8:L8");
  const cellK8 = sheet.getCell("K8");
  cellK8.value = "";
  cellK8.font = { name: "宋体", size: 10, bold: false };
  cellK8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellK8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("M8:N8");
  const cellM8 = sheet.getCell("M8");
  cellM8.value = "";
  cellM8.font = { name: "宋体", size: 10, bold: false };
  cellM8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellM8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("O8:P8");
  const cellO8 = sheet.getCell("O8");
  cellO8.value = "";
  cellO8.font = { name: "宋体", size: 10, bold: false };
  cellO8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellO8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Q8:R8");
  const cellQ8 = sheet.getCell("Q8");
  cellQ8.value = "";
  cellQ8.font = { name: "宋体", size: 10, bold: false };
  cellQ8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellQ8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("S8:T8");
  const cellS8 = sheet.getCell("S8");
  cellS8.value = "";
  cellS8.font = { name: "宋体", size: 10, bold: false };
  cellS8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellS8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("U8:V8");
  const cellU8 = sheet.getCell("U8");
  cellU8.value = "";
  cellU8.font = { name: "宋体", size: 10, bold: false };
  cellU8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellU8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("W8:X8");
  const cellW8 = sheet.getCell("W8");
  cellW8.value = "";
  cellW8.font = { name: "宋体", size: 10, bold: false };
  cellW8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellW8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Y8:Z8");
  const cellY8 = sheet.getCell("Y8");
  cellY8.value = "";
  cellY8.font = { name: "宋体", size: 10, bold: false };
  cellY8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellY8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellAA8 = sheet.getCell("AA8");
  cellAA8.value = "";
  cellAA8.font = { name: "宋体", size: 10, bold: false };
  cellAA8.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellAA8.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("A9:A20");
  const cellA9 = sheet.getCell("A9");
  cellA9.value = "轮\n座\n镶\n入\n部";
  cellA9.font = { name: "宋体", size: 10, bold: false };
  cellA9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellA9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellB9 = sheet.getCell("B9");
  cellB9.value = "1";
  cellB9.font = { name: "宋体", size: 10, bold: false };
  cellB9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellB9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C9:D9");
  const cellC9 = sheet.getCell("C9");
  cellC9.value = "";
  cellC9.font = { name: "宋体", size: 10, bold: false };
  cellC9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("E9:F9");
  const cellE9 = sheet.getCell("E9");
  cellE9.value = "";
  cellE9.font = { name: "宋体", size: 10, bold: false };
  cellE9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellE9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("G9:H9");
  const cellG9 = sheet.getCell("G9");
  cellG9.value = "";
  cellG9.font = { name: "宋体", size: 10, bold: false };
  cellG9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellG9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("I9:J9");
  const cellI9 = sheet.getCell("I9");
  cellI9.value = "";
  cellI9.font = { name: "宋体", size: 10, bold: false };
  cellI9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellI9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("K9:L9");
  const cellK9 = sheet.getCell("K9");
  cellK9.value = "";
  cellK9.font = { name: "宋体", size: 10, bold: false };
  cellK9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellK9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("M9:N9");
  const cellM9 = sheet.getCell("M9");
  cellM9.value = "";
  cellM9.font = { name: "宋体", size: 10, bold: false };
  cellM9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellM9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("O9:P9");
  const cellO9 = sheet.getCell("O9");
  cellO9.value = "";
  cellO9.font = { name: "宋体", size: 10, bold: false };
  cellO9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellO9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Q9:R9");
  const cellQ9 = sheet.getCell("Q9");
  cellQ9.value = "";
  cellQ9.font = { name: "宋体", size: 10, bold: false };
  cellQ9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellQ9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("S9:T9");
  const cellS9 = sheet.getCell("S9");
  cellS9.value = "";
  cellS9.font = { name: "宋体", size: 10, bold: false };
  cellS9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellS9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("U9:V9");
  const cellU9 = sheet.getCell("U9");
  cellU9.value = "";
  cellU9.font = { name: "宋体", size: 10, bold: false };
  cellU9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellU9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("W9:X9");
  const cellW9 = sheet.getCell("W9");
  cellW9.value = "";
  cellW9.font = { name: "宋体", size: 10, bold: false };
  cellW9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellW9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Y9:Z9");
  const cellY9 = sheet.getCell("Y9");
  cellY9.value = "";
  cellY9.font = { name: "宋体", size: 10, bold: false };
  cellY9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellY9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellAA9 = sheet.getCell("AA9");
  cellAA9.value = "";
  cellAA9.font = { name: "宋体", size: 10, bold: false };
  cellAA9.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellAA9.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellB10 = sheet.getCell("B10");
  cellB10.value = "2";
  cellB10.font = { name: "宋体", size: 10, bold: false };
  cellB10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellB10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C10:D10");
  const cellC10 = sheet.getCell("C10");
  cellC10.value = "";
  cellC10.font = { name: "宋体", size: 10, bold: false };
  cellC10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("E10:F10");
  const cellE10 = sheet.getCell("E10");
  cellE10.value = "";
  cellE10.font = { name: "宋体", size: 10, bold: false };
  cellE10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellE10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("G10:H10");
  const cellG10 = sheet.getCell("G10");
  cellG10.value = "";
  cellG10.font = { name: "宋体", size: 10, bold: false };
  cellG10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellG10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("I10:J10");
  const cellI10 = sheet.getCell("I10");
  cellI10.value = "";
  cellI10.font = { name: "宋体", size: 10, bold: false };
  cellI10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellI10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("K10:L10");
  const cellK10 = sheet.getCell("K10");
  cellK10.value = "";
  cellK10.font = { name: "宋体", size: 10, bold: false };
  cellK10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellK10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("M10:N10");
  const cellM10 = sheet.getCell("M10");
  cellM10.value = "";
  cellM10.font = { name: "宋体", size: 10, bold: false };
  cellM10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellM10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("O10:P10");
  const cellO10 = sheet.getCell("O10");
  cellO10.value = "";
  cellO10.font = { name: "宋体", size: 10, bold: false };
  cellO10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellO10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Q10:R10");
  const cellQ10 = sheet.getCell("Q10");
  cellQ10.value = "";
  cellQ10.font = { name: "宋体", size: 10, bold: false };
  cellQ10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellQ10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("S10:T10");
  const cellS10 = sheet.getCell("S10");
  cellS10.value = "";
  cellS10.font = { name: "宋体", size: 10, bold: false };
  cellS10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellS10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("U10:V10");
  const cellU10 = sheet.getCell("U10");
  cellU10.value = "";
  cellU10.font = { name: "宋体", size: 10, bold: false };
  cellU10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellU10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("W10:X10");
  const cellW10 = sheet.getCell("W10");
  cellW10.value = "";
  cellW10.font = { name: "宋体", size: 10, bold: false };
  cellW10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellW10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Y10:Z10");
  const cellY10 = sheet.getCell("Y10");
  cellY10.value = "";
  cellY10.font = { name: "宋体", size: 10, bold: false };
  cellY10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellY10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellAA10 = sheet.getCell("AA10");
  cellAA10.value = "";
  cellAA10.font = { name: "宋体", size: 10, bold: false };
  cellAA10.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellAA10.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellB11 = sheet.getCell("B11");
  cellB11.value = "";
  cellB11.font = { name: "宋体", size: 10, bold: false };
  cellB11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellB11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("C11:D11");
  const cellC11 = sheet.getCell("C11");
  cellC11.value = "";
  cellC11.font = { name: "宋体", size: 10, bold: false };
  cellC11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellC11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("E11:F11");
  const cellE11 = sheet.getCell("E11");
  cellE11.value = "";
  cellE11.font = { name: "宋体", size: 10, bold: false };
  cellE11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellE11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("G11:H11");
  const cellG11 = sheet.getCell("G11");
  cellG11.value = "";
  cellG11.font = { name: "宋体", size: 10, bold: false };
  cellG11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellG11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("I11:J11");
  const cellI11 = sheet.getCell("I11");
  cellI11.value = "";
  cellI11.font = { name: "宋体", size: 10, bold: false };
  cellI11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellI11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("K11:L11");
  const cellK11 = sheet.getCell("K11");
  cellK11.value = "";
  cellK11.font = { name: "宋体", size: 10, bold: false };
  cellK11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellK11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("M11:N11");
  const cellM11 = sheet.getCell("M11");
  cellM11.value = "";
  cellM11.font = { name: "宋体", size: 10, bold: false };
  cellM11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellM11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("O11:P11");
  const cellO11 = sheet.getCell("O11");
  cellO11.value = "";
  cellO11.font = { name: "宋体", size: 10, bold: false };
  cellO11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellO11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Q11:R11");
  const cellQ11 = sheet.getCell("Q11");
  cellQ11.value = "";
  cellQ11.font = { name: "宋体", size: 10, bold: false };
  cellQ11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellQ11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("S11:T11");
  const cellS11 = sheet.getCell("S11");
  cellS11.value = "";
  cellS11.font = { name: "宋体", size: 10, bold: false };
  cellS11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellS11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("U11:V11");
  const cellU11 = sheet.getCell("U11");
  cellU11.value = "";
  cellU11.font = { name: "宋体", size: 10, bold: false };
  cellU11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellU11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("W11:X11");
  const cellW11 = sheet.getCell("W11");
  cellW11.value = "";
  cellW11.font = { name: "宋体", size: 10, bold: false };
  cellW11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellW11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.mergeCells("Y11:Z11");
  const cellY11 = sheet.getCell("Y11");
  cellY11.value = "";
  cellY11.font = { name: "宋体", size: 10, bold: false };
  cellY11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellY11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  const cellAA11 = sheet.getCell("AA11");
  cellAA11.value = "";
  cellAA11.font = { name: "宋体", size: 10, bold: false };
  cellAA11.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  cellAA11.border = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  sheet.getRow(1).height = calcHeight(51.8);
  sheet.getRow(2).height = calcHeight(39.8);
  sheet.getRow(3).height = calcHeight(35.3);
  sheet.getRow(4).height = calcHeight(28.5);
  sheet.getRow(5).height = calcHeight(26.3);
  sheet.getRow(6).height = calcHeight(23.3);
  sheet.getRow(7).height = calcHeight(18.8);
  sheet.getRow(8).height = calcHeight(18.8);
  sheet.getRow(9).height = calcHeight(18);
  sheet.getRow(10).height = calcHeight(18.8);
  sheet.getRow(11).height = calcHeight(18.8);
  sheet.getRow(12).height = calcHeight(18.8);
  sheet.getRow(13).height = calcHeight(18.8);
  sheet.getRow(14).height = calcHeight(18.8);
  sheet.getRow(15).height = calcHeight(18.8);
  sheet.getRow(16).height = calcHeight(18.8);
  sheet.getRow(17).height = calcHeight(18.8);
  sheet.getRow(18).height = calcHeight(18.8);
  sheet.getRow(19).height = calcHeight(18.8);
  sheet.getRow(20).height = calcHeight(18.8);
  sheet.getRow(21).height = calcHeight(18.8);
  sheet.getColumn("A").width = calcWidth(7.92);
  sheet.getColumn("B").width = calcWidth(8.75);
  sheet.getColumn("C").width = calcWidth(2);
  sheet.getColumn("D").width = calcWidth(2);
  sheet.getColumn("E").width = calcWidth(2);
  sheet.getColumn("F").width = calcWidth(2);
  sheet.getColumn("G").width = calcWidth(2);
  sheet.getColumn("H").width = calcWidth(2);
  sheet.getColumn("I").width = calcWidth(2);
  sheet.getColumn("J").width = calcWidth(2);
  sheet.getColumn("K").width = calcWidth(2);
  sheet.getColumn("L").width = calcWidth(2);
  sheet.getColumn("M").width = calcWidth(2);
  sheet.getColumn("N").width = calcWidth(2);
  sheet.getColumn("O").width = calcWidth(2);
  sheet.getColumn("P").width = calcWidth(2);
  sheet.getColumn("Q").width = calcWidth(2);
  sheet.getColumn("R").width = calcWidth(2);
  sheet.getColumn("S").width = calcWidth(2);
  sheet.getColumn("T").width = calcWidth(2);
  sheet.getColumn("U").width = calcWidth(2);
  sheet.getColumn("V").width = calcWidth(2);
  sheet.getColumn("W").width = calcWidth(2);
  sheet.getColumn("X").width = calcWidth(2);
  sheet.getColumn("Y").width = calcWidth(2);
  sheet.getColumn("Z").width = calcWidth(2);
  sheet.getColumn("AA").width = calcWidth(7);

  const outputPath = join(app.getPath("documents"), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  await shell.openPath(outputPath);
};

export const initIpc = () => {
  ipcMain.handle("excel:quartor", withLog(quartor));
};
