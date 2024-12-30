import { app, BrowserWindow, ipcMain, shell } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, constants } from "node:fs/promises";
import * as channel from "./channel";
import type { NodeOdbcError } from "odbc";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
    autoHideMenuBar: false,

    width: 1024,
    height: 768,
  });

  win.setMenu(null);

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    console.log("did-finish-load");
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

const winword_32 =
  "C:\\Program Files (x86)\\Microsoft Office\\Office16\\WINWORD.EXE";
const winword_64 =
  "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE";
const winword365_32 =
  "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE";
const winword365_64 =
  "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE";

const execFileP = promisify(execFile);

const getWinword = async (path: string) => {
  await access(path, constants.R_OK);
  return path;
};

const runWinword = async (data: string) => {
  const winwords = await Promise.allSettled([
    getWinword(winword_32),
    getWinword(winword_64),
    getWinword(winword365_32),
    getWinword(winword365_64),
  ]);

  const winword = winwords.find((i) => i.status === "fulfilled")?.value;

  if (!winword) {
    throw new Error("Find winword failed");
  }

  const cp = await execFileP(
    winword,
    [
      data,
      "/save",
      "/q",
      "/pxslt",
      "/a",
      "/mFilePrint",
      "/mFileCloseOrExit",
      "/n",
      "/w",
      "/x",
    ],
    { windowsVerbatimArguments: false, shell: false },
  );
  return cp;
};

ipcMain.handle(channel.printer, async (e, data: string) => {
  const cp = await runWinword(data).catch(() => shell.openPath(data));
  void e;
  console.log(data, cp);
});

// 连接 Access 数据库（.mdb 或 .accdb）
const openDatabase = async (params: channel.DbParamsBase) => {
  const conStr =
    `DSN=${params.dsn};Driver={Microsoft Access Driver (*.mdb,*accdb)};DBQ=${params.path};PWD=${params.password}`;
  const connection = await odbc.connect(conStr);
  return connection;
};

const throwError = (error: unknown) => {
  const nodeOdbcError = error as NodeOdbcError;
  if ("odbcErrors" in nodeOdbcError) {
    throw nodeOdbcError.odbcErrors[0].message;
  }

  if (error instanceof Error) {
    throw error.message;
  }

  throw error;
};

const odbc: typeof import("odbc") = require("odbc");

ipcMain.handle(
  channel.queryQuartors,
  async (e, params: channel.DbParamsBase) => {
    void e;
    try {
      const connection = await openDatabase(params);
      const quartors = await connection.query("SELECT * FROM quartors");
      await connection.close();
      return { data: { rows: quartors } };
    } catch (error) {
      throwError(error);
    }
  },
);

ipcMain.handle(
  channel.queryVerifies,
  async (e, params: channel.DbParamsBase) => {
    void e;
    try {
      const connection = await openDatabase(params);
      const quartors = await connection.query("SELECT * FROM verifies");
      await connection.close();
      return { data: { rows: quartors } };
    } catch (error) {
      throwError(error);
    }
  },
);

ipcMain.handle(channel.openPath, async (e, path: string) => {
  void e;
  const data = await shell.openPath(path);
  return data;
});

ipcMain.handle(channel.openDevTools, () => {
  if (!win) return;
  win.webContents.openDevTools();
});

console.log(
  app.getPath("userData"),
);
