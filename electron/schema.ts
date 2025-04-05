import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
});

export type User = typeof usersTable.$inferSelect;

export const logTable = sqliteTable("log", {
  id: int().primaryKey({ autoIncrement: true }),
  type: text(),
  message: text(),
  date: text(),
});

export type Log = typeof logTable.$inferSelect;
