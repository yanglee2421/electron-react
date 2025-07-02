import Excel from "@yanglee2421/exceljs";
import { shell } from "electron/common";
import { app } from "electron/main";
import { join } from "node:path";
import { db } from "#/db";
import * as schema from "#/schema";
import * as sql from "drizzle-orm";
import dayjs from "dayjs";

const columnWidths = new Map([
  ["A", 7],
  ["B", 6],
  ["C", 12],
  ["D", 9],
  ["E", 9],
  ["F", 4],
  ["G", 4],
  ["H", 4],
  ["I", 4],
  ["J", 4],
  ["K", 4],
  ["L", 7],
  ["M", 16],
]);

const rowHeights = new Map([
  [1, 20.25],
  [48, 24],
]);

const inspectionItems = [
  "注：探测部位中,①②和③分别代表如下内容",
  "磁粉探伤时：①代表轴身；②代表轮座或幅板孔；③代表轴颈及防尘板座。探测时应在被探测部位栏中画“√”。",
  "超声波探伤时，①代表全轴穿透；②代表轮座镶入部；③代表轴颈根部（或卸荷槽）部位。探测时应在被探测部位栏中画“√”",
  "探伤方法，记录磁探、超探、微控超探。",
  "探伤性质，记录初探和复探，初探和复探分别填写车统-53A。",
  "微控超探发现缺陷时备注栏内注明“待复验”。",
  "新制车轴探伤时，在轮对首次组装栏填写车轴制造时间及单位",
];

const createRowHelper =
  (sheet: Excel.Worksheet) =>
  (rowId: number, callback?: (rowId: number, row: Excel.Row) => void) => {
    const row = sheet.getRow(rowId);
    row.height = 14.25;
    callback?.(rowId, row);
  };

const createCellHelper =
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

export const chr_53a = async () => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 10;
  sheet.properties.defaultRowHeight = 14.25;

  // A4
  sheet.pageSetup.paperSize = 9;
  sheet.pageSetup.orientation = "portrait";
  sheet.pageSetup.horizontalCentered = true;
  sheet.pageSetup.verticalCentered = false;
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.printArea = "A1:M52";

  sheet.headerFooter.oddHeader = "&R车统-53A";
  sheet.headerFooter.evenHeader = "&R车统-53A";
  sheet.headerFooter.oddFooter = "第 &P 页，共 &N 页";
  sheet.headerFooter.evenFooter = "第 &P 页，共 &N 页";

  // Get Cell Utils
  const cell = createCellHelper(sheet);
  const row = createRowHelper(sheet);

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
      cell.border = {};
    });
  });

  row(3, (row) => {
    cell(`A${row}`, (cell) => {
      cell.font = { size: 9, name: "宋体" };
      cell.value = "单位名称";
      cell.border = {};
    });

    cell(`B${row}:C${row}`, (cell) => {
      cell.font = { size: 9, name: "宋体" };
      cell.value = ``;
      cell.border = {};
    });

    cell(`D${row}:E${row}`, (cell) => {
      cell.font = { size: 9, name: "宋体", underline: true };
      cell.value = `探伤方法：微控超探`;
      cell.border = {};
    });

    cell(`F${row}:H${row}`, (cell) => {
      cell.font = { size: 9, name: "宋体" };
      cell.value = `探伤性质：初探`;
      cell.border = {};
    });

    cell(`I${row}:J${row}`, (cell) => {
      cell.font = { size: 9, name: "宋体" };
      cell.value = `探伤者:`;
      cell.border = {};
    });

    cell(`K${row}:L${row}`, (cell) => {
      cell.font = { size: 9, name: "宋体" };
      cell.value = ``;
      cell.border = {};
    });

    cell(`M${row}`, (cell) => {
      cell.font = { size: 9, name: "宋体" };
      cell.value = dayjs().format(`YYYY-MM-DD`);
      cell.border = {};
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

    cell(`F${row}:K${row}`, (cell) => {
      cell.value = "探测部位";
    });

    cell(`L${row}:L${row + 2}`, (cell) => {
      cell.value = `探测\n结果`;
      cell.alignment = {
        wrapText: true,
        vertical: "middle",
        horizontal: "center",
      };
    });

    cell(`M${row}:M${row + 2}`, (cell) => {
      cell.value = `备注`;
    });
  });

  row(5, (row) => {
    cell(`F${row}:G${row}`, (cell) => {
      cell.value = "①";
    });
    cell(`H${row}:I${row}`, (cell) => {
      cell.value = "②";
    });
    cell(`J${row}:K${row}`, (cell) => {
      cell.value = "③";
    });
  });

  row(6, (row) => {
    cell(`D${row}`, (cell) => {
      cell.value = "时间";
    });
    cell(`E${row}`, (cell) => {
      cell.value = "单位";
    });
    ["F", "G", "H", "I", "J", "K"].forEach((col, idx) => {
      cell(`${col + row}`, (cell) => {
        cell.value = Object.is(idx % 2, 0) ? "左" : "右";
      });
    });
  });

  for (let i = 7; i < 46; i++) {
    row(i, (row) => {
      cell(`A${row}`, (cell) => {
        cell.value = i - 6;
      });
      cell(`B${row}`, (cell) => {
        cell.value = "RE2B";
      });
      cell(`C${row}`, (cell) => {
        cell.value = "10100";
      });
      cell(`D${row}`, (cell) => {
        cell.value = dayjs().format("YYYYMMDD");
      });
      cell(`E${row}`, (cell) => {
        cell.value = 131;
      });
      cell(`F${row}`, (cell) => {
        cell.value = "√";
      });
      cell(`G${row}`, (cell) => {
        cell.value = "√";
      });
      cell(`H${row}`, (cell) => {
        cell.value = "√";
      });
      cell(`I${row}`, (cell) => {
        cell.value = "√";
      });
      cell(`J${row}`, (cell) => {
        cell.value = "√";
      });
      cell(`K${row}`, (cell) => {
        cell.value = "√";
      });
      cell(`L${row}`, (cell) => {
        cell.value = "合格";
      });
      cell(`M${row}`);
    });
  }

  inspectionItems.forEach((value, idx) => {
    row(idx + 46, (id) => {
      cell(`A${id}:M${id}`, (cell) => {
        cell.font = { size: 10, name: "宋体" };
        cell.alignment = { horizontal: "left", wrapText: Object.is(idx, 2) };
        cell.value = `${idx + 1}.${value}`;
        cell.border = {};
      });
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
