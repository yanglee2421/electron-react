import * as fs from "node:fs";
import * as os from "node:os";
import * as url from "node:url";
import * as path from "node:path";
import Database from "better-sqlite3";
import { app, ipcMain, BrowserWindow } from "electron";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "#main/schema";
import { channel } from "#main/channel";
import { devError, promiseTry } from "#main/utils";
import type { Callback } from "#main/utils";

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

export const getDirection = (nBoard: number) => {
  //board(板卡)：0.左 1.右
  switch (nBoard) {
    case 1:
      return "右";
    case 0:
      return "左";
    default:
      return "";
  }
};

export const getPlace = (nChannel: number) => {
  //channel：0.穿透 1~2.轴颈 3~8.轮座
  switch (nChannel) {
    case 0:
      return "穿透";
    case 1:
    case 2:
      return "卸荷槽";
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      return "轮座";
    default:
      return "车轴";
  }
};

export const createEmit = <TData = void>(channel: string) => {
  return (data: TData) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(channel, data);
    });
  };
};

export const getTempDir = () =>
  path.join(app.getPath("temp"), "wtxy_tookit_cmd");

export const removeTempDir = async () => {
  const tempDir = getTempDir();
  await fs.promises.rm(tempDir, { recursive: true, force: true });
};

export const makeTempDir = async () => {
  const tempDir = getTempDir();
  const result = await fs.promises.mkdir(tempDir, { recursive: true });
  return result;
};

type Log = {
  id: number;
  type: string;
  message: string;
  date: string;
};

export const log = (message: string, type = "info") => {
  const data: Log = {
    id: 0,
    date: new Date().toISOString(),
    message,
    type,
  };

  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send(channel.log, data);
  });
};

const errorToMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return String(error);
};

export const withLog = <TArgs extends unknown[], TReturn = void>(
  callback: Callback<TArgs, TReturn>,
) => {
  const resultFn = async (...args: TArgs) => {
    try {
      // Ensure an error is thrown when the promise is rejected
      const result = await promiseTry(callback, ...args);
      return result;
    } catch (error) {
      devError(error);
      // Log the error message
      const message = errorToMessage(error);
      log(message, "error");
      // Throw message instead of error to avoid electron issue #24427
      throw message;
    }
  };

  return resultFn;
};

export const ipcHandle = (...args: Parameters<typeof ipcMain.handle>) => {
  const [channel, listener] = args;
  return ipcMain.handle(channel, withLog(listener));
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
const createDB = () => {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const dbPath = path.resolve(app.getPath("userData"), "db.db");
  const sqliteDb = new Database(dbPath);
  const db = drizzle(sqliteDb, { schema });

  migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });

  return db;
};
export const db = createDB();

export const ls = async (basePath: string, set: Set<string>) => {
  const basePathStat = await fs.promises.stat(basePath);
  const isFile = basePathStat.isFile();
  const isDirectory = basePathStat.isDirectory();

  if (isFile) {
    set.add(basePath);
  }

  if (isDirectory) {
    const basenames = await fs.promises.readdir(basePath);

    for (const basename of basenames) {
      const fullPath = path.resolve(basePath, basename);
      await ls(fullPath, set);
    }
  }
};
