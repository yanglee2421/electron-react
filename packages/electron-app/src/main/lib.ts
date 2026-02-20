import * as os from "node:os";
import * as url from "node:url";
import * as path from "node:path";
import Database from "better-sqlite3";
import { app, BrowserWindow } from "electron";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "#main/schema";

export type SQLiteDBType = ReturnType<typeof createSQLiteDB>;

export const getIP = () => {
  const interfaces = os.networkInterfaces();
  const IP = Object.values(interfaces)
    .flat()
    .find((i) => {
      if (!i) return false;

      if (i.family !== "IPv4") {
        return false;
      }

      if (i.address === "192.168.1.100") {
        return false;
      }

      return !i.internal;
    })?.address;
  return IP || "";
};

export const createEmit = <TData = void>(channel: string) => {
  return (data: TData) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(channel, data);
    });
  };
};

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
export const createSQLiteDB = () => {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const dbPath = path.resolve(app.getPath("userData"), "db.db");
  const sqliteDb = new Database(dbPath);
  const db = drizzle(sqliteDb, { schema });

  migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });

  return db;
};
