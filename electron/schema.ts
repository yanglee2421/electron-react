import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const jtvBarcodeTable = sqliteTable("jtv_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
});

export type JTVBarcode = typeof jtvBarcodeTable.$inferSelect;

export const jtvSettingTable = sqliteTable("jtv_setting", {
  id: int("id").primaryKey({ autoIncrement: true }),
  host: text("host"),
  autoInput: int("autoInput", { mode: "boolean" }),
  autoUpload: int("autoUpload", { mode: "boolean" }),
  autoUploadInterval: int("autoUploadInterval"),
  unitCode: text("unitCode"),
});

export type JTVSetting = typeof jtvSettingTable.$inferSelect;

export const settingsTable = sqliteTable("settings", {
  id: int("id").primaryKey({ autoIncrement: true }),
  databasePath: text("databasePath"),
  driverPath: text("driverPath"),
  activateCode: text("activateCode"),
});

export type Settings = typeof settingsTable.$inferSelect;

export const hxzyHmisTable = sqliteTable("hxzy_hmis", {
  id: int("id").primaryKey({ autoIncrement: true }),
  host: text("host"),
  autoInput: int("autoInput", { mode: "boolean" }),
  autoUpload: int("autoUpload", { mode: "boolean" }),
  autoUploadInterval: int("autoUploadInterval"),
  gd: text("gd"),
});

export type HxzyHmisSetting = typeof hxzyHmisTable.$inferSelect;

export const hxzyBarcodeTable = sqliteTable("hxzy_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
});

export type HxzyBarcode = typeof hxzyBarcodeTable.$inferSelect;

export const jtvXuzhoubeiHmisTable = sqliteTable("jtv_xuzhoubei_hmis", {
  id: int("id").primaryKey({ autoIncrement: true }),
  host: text("host"),
  autoInput: int("autoInput", { mode: "boolean" }),
  autoUpload: int("autoUpload", { mode: "boolean" }),
  autoUploadInterval: int("autoUploadInterval"),
  username_prefix: text("username_prefix"),
});

export type JtvXuzhoubeiHmisSetting = typeof jtvXuzhoubeiHmisTable.$inferSelect;

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

export const khHmisTable = sqliteTable("kh_hmis", {
  id: int("id").primaryKey({ autoIncrement: true }),
  host: text("host"),
  autoInput: int("autoInput", { mode: "boolean" }),
  autoUpload: int("autoUpload", { mode: "boolean" }),
  autoUploadInterval: int("autoUploadInterval"),
  tsgz: text("tsgz"),
  tszjy: text("tszjy"),
  tsysy: text("tsysy"),
});

export type KhHmisSetting = typeof khHmisTable.$inferSelect;

export const khBarcodeTable = sqliteTable("kh_barcode", {
  id: int("id").primaryKey({ autoIncrement: true }),
  barCode: text("barCode"),
  zh: text("zh"),
  date: int("date", { mode: "timestamp" }),
  isUploaded: int("isUploaded", { mode: "boolean" }),
});

export type KhBarcode = typeof khBarcodeTable.$inferSelect;
