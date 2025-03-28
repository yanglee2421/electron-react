import { app, BrowserWindow, ipcMain, shell } from "electron";
// import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as channel from "./channel";
import {
  getCpuSerial,
  getMotherboardSerial,
  runWinword,
  execFileAsync,
  getDataFromAccessDatabase,
  getIP,
  getDeviceNo,
  withLog,
} from "./lib";
import dayjs from "dayjs";
import * as consts from "@/lib/constants";
import * as hxzyHmis from "./hxzy_hmis";
import type { GetDataFromAccessDatabaseParams } from "@/api/database_types";
import type { AutoInputToVCParams } from "@/api/autoInput_types";

// const require = createRequire(import.meta.url);
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

  win.menuBarVisible = false;

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

ipcMain.handle(
  channel.openDevTools,
  withLog(async () => {
    if (!win) return;
    win.webContents.openDevTools();
  })
);

ipcMain.handle(
  channel.openPath,
  withLog(async (e, path: string) => {
    void e;
    const data = await shell.openPath(path);
    return data;
  })
);

ipcMain.handle(
  channel.getCpuSerial,
  withLog(async () => {
    const data = await getCpuSerial();
    return data;
  })
);

ipcMain.handle(
  channel.getMotherboardSerial,
  withLog(async () => {
    const data = await getMotherboardSerial();
    return data;
  })
);

ipcMain.handle(
  channel.hxzy_hmis_get_data,
  withLog(async (e, params: hxzyHmis.GetRequest) => {
    void e;
    const data = await hxzyHmis.getFn(params);
    return data;
  })
);

ipcMain.handle(
  channel.hxzy_hmis_save_data,
  withLog(async (e, params: hxzyHmis.SaveDataParams) => {
    void e;
    const startDate = dayjs().startOf("day").format(consts.DATE_FORMAT);
    const endDate = dayjs().endOf("day").format(consts.DATE_FORMAT);
    const eq_ip = getIP();
    const deviceNo = await getDeviceNo({
      driverPath: params.driverPath,
      databasePath: params.databasePath,
    });

    const settledData = await Promise.allSettled(
      params.records.map((record) =>
        hxzyHmis.recordToSaveDataParams(
          record,
          eq_ip,
          deviceNo || "",
          startDate,
          endDate,
          params.driverPath,
          params.databasePath
        )
      )
    );

    const data = settledData
      .filter((i) => i.status === "fulfilled")
      .map((i) => i.value);

    const dhs = data.map((i) => i.dh);

    if (!data.length) {
      throw `单号[${dhs.join(",")}],均未找到对应的记录`;
    }

    const request: hxzyHmis.PostRequest = {
      data,
      host: params.host,
    };

    const result = await hxzyHmis.postFn(request);

    return { result, dhs };
  })
);

ipcMain.handle(
  channel.hxzy_hmis_upload_verifies,
  withLog(async (e, params: hxzyHmis.UploadVerifiesParams) => {
    void e;
    const data = await hxzyHmis.idToUploadVerifiesData(
      params.id,
      params.driverPath,
      params.databasePath
    );

    return data;
  })
);

ipcMain.handle(
  channel.autoInputToVC,
  withLog(async (e, data: AutoInputToVCParams) => {
    void e;
    const exePath = data.driverPath;

    const cp = await execFileAsync(exePath, [
      "autoInputToVC",
      data.zx,
      data.zh,
      data.czzzdw,
      data.sczzdw,
      data.mczzdw,
      data.czzzrq,
      data.sczzrq,
      data.mczzrq,
      data.ztx,
      data.ytx,
    ]);

    if (cp.stderr) {
      throw cp.stderr;
    }

    return cp.stdout;
  })
);

ipcMain.handle(
  channel.printer,
  withLog(async (e, data: string) => {
    void e;
    const cp = await runWinword(data).catch(() => shell.openPath(data));
    return cp;
  })
);

ipcMain.handle(
  channel.getDataFromAccessDatabase,
  withLog(async (e, params: GetDataFromAccessDatabaseParams) => {
    void e;

    const data = await getDataFromAccessDatabase({
      driverPath: params.driverPath,
      databasePath: params.databasePath,
      sql: params.query,
    });

    return data;
  })
);

ipcMain.handle(
  channel.mem,
  withLog(async () => {
    const processMemoryInfo = await process.getProcessMemoryInfo();
    const freemem = processMemoryInfo.residentSet;

    return {
      totalmem: process.getSystemMemoryInfo().total,
      freemem,
    };
  })
);
