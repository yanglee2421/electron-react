import {
  int,
  sqliteTable,
  text,
  numeric,
  unique,
} from "drizzle-orm/sqlite-core";

export const jtvBarcodeTable = sqliteTable("jtv_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
});

export type JTVBarcode = typeof jtvBarcodeTable.$inferSelect;

export const hxzyBarcodeTable = sqliteTable("hxzy_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
});

export type HxzyBarcode = typeof hxzyBarcodeTable.$inferSelect;

export const jtvXuzhoubeiBarcodeTable = sqliteTable("jtv_xuzhoubei_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
  PJ_ZZRQ: text("PJ_ZZRQ"),
  PJ_ZZDW: text("PJ_ZZDW"),
  PJ_SCZZRQ: text("PJ_SCZZRQ"),
  PJ_SCZZDW: text("PJ_SCZZDW"),
  PJ_MCZZRQ: text("PJ_MCZZRQ"),
  PJ_MCZZDW: text("PJ_MCZZDW"),
});

export type JtvXuzhoubeiBarcode = typeof jtvXuzhoubeiBarcodeTable.$inferSelect;

export const khBarcodeTable = sqliteTable("kh_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
});

export type KhBarcode = typeof khBarcodeTable.$inferSelect;

export const xlsxSizeTable = sqliteTable(
  "xlsxSize",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    type: text("type"),
    index: text("index"),
    size: numeric("size", { mode: "number" }),
    xlsxName: text("xlsxName"),
  },
  (table) => [
    unique("xlsxName_position_unique").on(table.index, table.xlsxName),
  ],
);

export type XlsxSize = typeof xlsxSizeTable.$inferSelect;
