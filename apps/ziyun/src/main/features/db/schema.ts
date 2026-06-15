import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type KhBarcode = typeof khBarcodeTable.$inferSelect;
export type HxzyBarcode = typeof hxzyBarcodeTable.$inferSelect;
export type JTVBarcode = typeof jtvBarcodeTable.$inferSelect;
export type JtvXuzhoubeiBarcode = typeof jtvXuzhoubeiBarcodeTable.$inferSelect;
export type JTVGuangzhoubeiBarcode =
  typeof jtvGuangzhoubeiBarcodeTable.$inferSelect;
export type JTVGuangzhoujibaoduanBarcode =
  typeof jtvGuangzhoujibaoduanBarcodeTable.$inferSelect;
export type Log = typeof logTable.$inferSelect;

export const jtvBarcodeTable = sqliteTable("jtv_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
  CZZZDW: text("CZZZDW"),
  CZZZRQ: text("CZZZRQ"),
});

export const hxzyBarcodeTable = sqliteTable("hxzy_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
});

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

export const khBarcodeTable = sqliteTable("kh_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
});

export const jtvGuangzhoubeiBarcodeTable = sqliteTable(
  "jtv_guangzhoubei_barcode",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    barCode: text("barCode"),
    zh: text("zh"),
    date: int("date", { mode: "timestamp" }),
    isUploaded: int("isUploaded", { mode: "boolean" }),
    CZZZDW: text("CZZZDW"),
    CZZZRQ: text("CZZZRQ"),
  },
);

export const jtvGuangzhoujibaoduanBarcodeTable = sqliteTable(
  "jtv_guangzhoujibaoduan_barcode",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    barCode: text("barCode"),
    zh: text("zh"),
    date: int("date", { mode: "timestamp" }),
    isUploaded: int("isUploaded", { mode: "boolean" }),
    CZZZDW: text("CZZZDW"),
    CZZZRQ: text("CZZZRQ"),
  },
);

export const kvTable = sqliteTable("kv", {
  key: text("key").primaryKey(),
  value: text("value"),
});

export const logTable = sqliteTable("log", {
  id: int("id").primaryKey({ autoIncrement: true }),
  date: int("date", { mode: "timestamp" }).$default(() => new Date()),
  level: text("level").default("log"),
  title: text("title"),
  message: text("message"),
  json: text("json"),
});
