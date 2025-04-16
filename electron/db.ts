import { app } from "electron";
import { createRequire } from "node:module";
import * as path from "node:path";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const dbPath = path.resolve(app.getPath("userData"), "db.db");
const require = createRequire(import.meta.url);
const Database: typeof import("better-sqlite3") = require("better-sqlite3");
const sqliteDb = new Database(dbPath);
export const db = drizzle(sqliteDb, { schema });
migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
