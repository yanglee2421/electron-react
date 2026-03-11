import * as schema from "#main/db/schema";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

/**
 * In Node.js:
 * Importing a .cjs file from within an ESM module is allowed (but only the default export is accessible).
 * However, importing a .node file directly in ESM is not allowed.
 * .node files must be loaded using `require`, not `import`.
 * Therefore, if you want to use a .node file in an ESM module, there are two options:
 * 1. Use `createRequire` to create a CommonJS-style `require` function and load the .node file;
 * 2. Create a .cjs file that uses `require` to load the .node file, and then import that .cjs file in your ESM module.
 *
 * NOTE:
 * A .node file is a compiled native addon for Node.js, typically written in C or C++.
 * It is a dynamically-linked binary module that allows high-performance or low-level system functionality
 * to be accessed from JavaScript.
 * These files are loaded using `require()` and expose functions or objects that can be used like regular modules.
 * .node files are commonly used for performance-critical tasks, such as cryptography, image processing, or hardware access.
 */
// import { createRequire } from "node:module";
// const require = createRequire(import.meta.url);
// const Database: typeof import("better-sqlite3") = require("better-sqlite3");

type CreateSQLiteDBOptions = {
  databasePath: string;
  migrationsFolder: string;
};

export type SQLiteDBType = ReturnType<typeof createSQLiteDB>;

export const createSQLiteDB = (options: CreateSQLiteDBOptions) => {
  const { databasePath, migrationsFolder } = options;
  const sqliteDb = new Database(databasePath);
  const db = drizzle({ schema, client: sqliteDb });

  try {
    migrate(db, { migrationsFolder });
  } catch (error) {
    console.error("Database migration failed:", databasePath);

    throw error;
  }

  return db;
};
