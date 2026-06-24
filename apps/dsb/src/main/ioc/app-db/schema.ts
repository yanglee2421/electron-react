import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const kvTable = sqliteTable("kv", {
  key: text("key").primaryKey(),
  value: text("value"),
});
