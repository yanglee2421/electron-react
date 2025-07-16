import type Excel from "@yanglee2421/exceljs";

export const pageSetup = (sheet: Excel.Worksheet) => {
  // A4
  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "portrait";
  // sheet.pageSetup.verticalDpi = 300;
  // sheet.pageSetup.horizontalDpi = 300;
  sheet.pageSetup.horizontalCentered = true;
  sheet.pageSetup.verticalCentered = false;
  sheet.pageSetup.fitToPage = true;
  // sheet.pageSetup.scale = 125;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.margins = {
    left: 0.5,
    right: 0.5,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3,
  };
};

export const createRowHelper =
  (sheet: Excel.Worksheet) =>
  (rowId: number, callback?: (rowId: number, row: Excel.Row) => void) => {
    const row = sheet.getRow(rowId);
    row.height = 14.25;
    callback?.(rowId, row);
  };

export const createCellHelper =
  (sheet: Excel.Worksheet) =>
  (cellName: string, callback?: (cell: Excel.Cell) => void) => {
    if (cellName.includes(":")) {
      sheet.mergeCells(cellName);
    }
    const cell = sheet.getCell(cellName);
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      left: { style: "thin" },
      right: { style: "thin" },
      top: { style: "thin" },
      bottom: { style: "thin" },
    };
    callback?.(cell);
    return cell;
  };
