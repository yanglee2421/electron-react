import { app } from "electron/main";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";

/**
 * In Node.js:
 * Importing a .cjs file from an ESM module is allowed (but only the default export is accessible).
 * However, importing a .node file directly in ESM is not allowed.
 * .node files must be loaded using `require`, not `import`.
 * Therefore, if you want to use a .node file in ESM, there are two options:
 * 1. Use `createRequire` to create a `require` function and load the .node file;
 * 2. Create a .cjs file that requires the .node file, and then import that .cjs file in your ESM module.
 */
// import { createRequire } from "node:module";
// const require = createRequire(import.meta.url);
// const Database: typeof import("better-sqlite3") = require("better-sqlite3");
const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(app.getPath("userData"), "db.db");
const sqliteDb = new Database(dbPath);
export const db = drizzle(sqliteDb, { schema });
migrate(db, { migrationsFolder: join(__dirname, "../drizzle") });
