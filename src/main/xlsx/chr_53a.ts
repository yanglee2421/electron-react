import Excel from "@yanglee2421/exceljs";
import { shell, app } from "electron";
import { join } from "node:path";
import { db } from "#/db";
import * as schema from "#/schema";
import * as sql from "drizzle-orm";
import dayjs from "dayjs";
import { Worker } from "node:worker_threads";
import workerPath from "#/mdb.worker?modulePath";
import type { Detection } from "#/cmd";
import { settings } from "#/store";
import { createCellHelper, createRowHelper, pageSetup } from "./utils";
import { mkdir } from "node:fs/promises";

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
  // [48, 24],
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

export const chr_53a = async (rowIds: string[]) => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");
  sheet.properties.defaultColWidth = 10;
  sheet.properties.defaultRowHeight = 14.25;

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

  const rows = await new Promise<Detection[]>((resolve, reject) => {
    const databasePath = settings.get("databasePath");
    const worker = new Worker(workerPath, {
      workerData: {
        tableName: "detections",
        databasePath,
        filters: [
          {
            type: "in",
            field: "szIDs",
            value: rowIds,
          },
        ],
      },
    });
    worker.once("message", (data) => {
      resolve(data.rows);
      worker.terminate();
    });
    worker.once("error", (error) => {
      reject(error);
      worker.terminate();
    });
  });

  rows.forEach((rowData, index) => {
    const i = index + 7;
    row(i, (row) => {
      cell(`A${row}`, (cell) => {
        cell.value = i - 6;
      });
      cell(`B${row}`, (cell) => {
        cell.value = rowData.szWHModel;
      });
      cell(`C${row}`, (cell) => {
        cell.value = rowData.szIDsWheel;
      });
      cell(`D${row}`, (cell) => {
        cell.value = dayjs(rowData.tmnow).format("YYYYMMDD");
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
        cell.value = rowData.bWheelLS ? "√" : null;
      });
      cell(`K${row}`, (cell) => {
        cell.value = rowData.bWheelRS ? "√" : null;
      });
      cell(`L${row}`, (cell) => {
        cell.value = rowData.szResult;
      });
      cell(`M${row}`);
    });
  });

  const renderEmptyRows = (i: number) => {
    row(i, (row) => {
      cell(`A${row}`);
      cell(`B${row}`);
      cell(`C${row}`);
      cell(`D${row}`);
      cell(`E${row}`);
      cell(`F${row}`);
      cell(`G${row}`);
      cell(`H${row}`);
      cell(`I${row}`);
      cell(`J${row}`);
      cell(`K${row}`);
      cell(`L${row}`);
      cell(`M${row}`);
    });
  };

  const needEmptyRows = rows.length < 39;

  if (needEmptyRows) {
    for (let i = 7 + rows.length; i < 46; i++) {
      renderEmptyRows(i);
    }
  }

  const rowCount = needEmptyRows ? 39 : rows.length;
  sheet.pageSetup.printArea = `A1:M${6 + rowCount + inspectionItems.length}`;
  pageSetup(sheet);

  inspectionItems.forEach((value, idx) => {
    row(6 + rowCount + idx + 1, (id, row) => {
      if (idx === 2) {
        row.height = 24;
      }

      cell(`A${id}:M${id}`, (cell) => {
        cell.font = { size: 10, name: "宋体" };
        cell.alignment = { horizontal: "left", wrapText: Object.is(idx, 2) };
        cell.value = `${idx + 1}.${value}`;
        cell.border = {};
      });
    });
  });

  // Default column widths and row heights
  columnWidths.forEach((width, col) => {
    sheet.getColumn(col).width = width;
  });

  rowHeights.forEach((height, rowId) => {
    sheet.getRow(rowId).height = height;
  });

  // Mannually set row heights and column widths
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

  const outputPath = join(app.getPath("temp"), "wtxy_tookit_cmd");
  const filePath = join(outputPath, `output${Date.now()}.xlsx`);
  await mkdir(outputPath, { recursive: true });
  await workbook.xlsx.writeFile(filePath);
  await shell.openPath(filePath);
};
