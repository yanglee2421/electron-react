import Excel from "@yanglee2421/exceljs";
import { shell } from "electron/common";
import { app } from "electron/main";
import { join } from "node:path";
import { db } from "#/db";
import * as schema from "#/schema";
import * as sql from "drizzle-orm";
import dayjs from "dayjs";

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

const inspectionItems = [
  "注：探测部位中,①②和③分别代表如下内容",
  "磁粉探伤时：①代表轴身；②代表轮座或幅板孔；③代表轴颈及防尘板座。探测时应在被探测部位栏中画“√”，全轴都探时，①②和③则都画“√”",
  "超声波探伤时，①代表全轴穿透；②代表轮座镶入部；③代表轴颈根部（或卸荷槽）部位。探测时应在被探测部位栏中画",
  "“√”",
  "探伤方法，记录磁探、超探、微控超探",
  "探伤性质，记录初探和复探，初探和复探分别填写车统-53A",
  "微控超探发现缺陷时备注栏内注明“待复验”",
  "车统-53A装订成册，进行日小记和月累计统计",
];

const row = (row: number, callback?: (row: number) => void) => {
  callback?.(row);
};

const createCellHelper =
  (sheet: Excel.Worksheet) =>
  (cellName: string, callback?: (cell: Excel.Cell) => void) => {
    if (cellName.includes(":")) {
      sheet.mergeCells(cellName);
    }
    const cell = sheet.getCell(cellName);
    cell.alignment = { vertical: "middle", horizontal: "center" };
    callback?.(cell);
    return cell;
  };

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

  // Get Cell Utils
  const cell = createCellHelper(sheet);

  row(1, (row) => {
    cell(`A${row}:M${row + 1}`, (cell) => {
      cell.value = {
        richText: [
          {
            font: {
              size: 16,
              name: "宋体",
              bold: true,
            },
            text: "铁路货车轮轴（轮对、",
          },
          {
            font: {
              size: 16,
              name: "宋体",
              bold: true,
              strike: true,
            },
            text: "车轴、车轮",
          },
          {
            font: {
              size: 16,
              name: "宋体",
              bold: true,
            },
            text: "）超声波 探伤记录",
          },
        ],
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
  });

  row(3, (row) => {
    cell(`A${row}`, (cell) => {
      cell.value = "单位名称";
    });

    cell(`B${row}:C${row}`, (cell) => {
      cell.value = ``;
    });

    cell(`D${row}:E${row}`, (cell) => {
      cell.value = `探伤方法：微控超探`;
      cell.font = { underline: true };
    });

    cell(`F${row}:H${row}`, (cell) => {
      cell.value = `探伤性质：初探`;
    });

    cell(`I${row}:J${row}`, (cell) => {
      cell.value = `探伤者:`;
    });

    cell(`K${row}:L${row}`, (cell) => {
      cell.value = ``;
    });

    cell(`M${row}`, (cell) => {
      cell.value = dayjs().format(`YYYY-MM-DD`);
    });
  });

  row(4, (row) => {
    cell(`A${row}:A${row + 2}`, (cell) => {
      cell.alignment = {
        wrapText: true,
        vertical: "middle",
        horizontal: "center",
      };
      cell.value = `序\n号`;
    });

    cell(`B${row}:B${row + 2}`, (cell) => {
      cell.value = `轴型`;
    });

    cell(`C${row}:C${row + 2}`, (cell) => {
      cell.value = `轴号`;
    });

    cell(`D${row}:E${row + 1}`, (cell) => {
      cell.value = `轮对首次组装`;
    });
  });

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
  const outputPath = join(app.getPath("temp"), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  await shell.openPath(outputPath);
};
