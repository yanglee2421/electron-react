import { app, BrowserWindow, ipcMain, shell, nativeTheme } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import * as channel from "./channel";
import {
  getCpuSerial,
  getMotherboardSerial,
  runWinword,
  execFileAsync,
  getDataFromAccessDatabase,
  getIP,
  getCorporation,
  withLog,
  DATE_FORMAT_DATABASE,
} from "./lib";
import dayjs from "dayjs";
import { getSerialFromStdout } from "@/lib/utils";
import * as hxzyHmis from "./hxzy_hmis";
import * as jtvHmis from "./jtv_hmis";
import * as jtvHmisXuzhoubei from "./jtv_hmis_xuzhoubei";
import * as khHmis from "./kh_hmis";
import type { GetDataFromAccessDatabaseParams } from "#/electron/database_types";
import type { AutoInputToVCParams } from "#/electron/autoInput_types";

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
process.env.APP_ROOT = path.join(__dirname, "..");
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
      nodeIntegration: false,
    },

    autoHideMenuBar: false,
    // alwaysOnTop: true,

    width: 1024,
    height: 768,
    // show: false,
  });

  win.menuBarVisible = false;

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    console.log("did-finish-load");
  });
  win.on("focus", () => {
    win?.webContents.send(channel.windowFocus);
  });
  win.on("blur", () => {
    win?.webContents.send(channel.windowBlur);
  });
  win.on("show", () => {
    // Only fire when the win.show is called on Windows
    win?.webContents.send(channel.windowShow);
  });
  win.on("hide", () => {
    // Only fire when the win.hide is called on Windows
    win?.webContents.send(channel.windowHide);
  });
  win.once("ready-to-show", () => {
    // Too late to call win.show() here
    // win?.show();
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

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  if (import.meta.env.DEV) {
    // Disable hardware acceleration to avoid the black screen issue on Windows.
    app.disableHardwareAcceleration();
  }

  app.whenReady().then(async () => {
    createWindow();
  });
}

ipcMain.handle(
  channel.openDevTools,
  withLog(async () => {
    if (!win) return;
    win.webContents.openDevTools();
  }),
);

ipcMain.handle(
  channel.openPath,
  withLog(async (e, path: string) => {
    // Prevent unused variable error
    void e;
    const data = await shell.openPath(path);
    return data;
  }),
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
  }),
);

ipcMain.handle(
  channel.toggleMode,
  withLog(async (e, mode: "system" | "dark" | "light") => {
    // Prevent unused variable warning
    void e;
    nativeTheme.themeSource = mode;
  }),
);

ipcMain.handle(
  channel.setAlwaysOnTop,
  withLog(async (e, alwaysOnTop: boolean) => {
    // Prevent unused variable warning
    void e;
    win?.setAlwaysOnTop(alwaysOnTop);
  }),
);

ipcMain.handle(
  channel.getLoginItemSettings,
  withLog(async (e) => {
    // Prevent unused variable warning
    void e;
    return app.getLoginItemSettings().openAtLogin;
  }),
);

ipcMain.handle(
  channel.setLoginItemSettings,
  withLog(async (e, openAtLogin: boolean) => {
    // Prevent unused variable warning
    void e;
    app.setLoginItemSettings({ openAtLogin });
  }),
);

ipcMain.handle(
  channel.getVersion,
  withLog(async () => app.getVersion()),
);

ipcMain.handle(
  channel.printer,
  withLog(async (e, data: string) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await runWinword(data).catch(() => shell.openPath(data));
  }),
);

ipcMain.handle(
  channel.getCpuSerial,
  withLog(async () => {
    // Ensure an error is thrown when the promise is rejected
    return await getCpuSerial();
  }),
);

ipcMain.handle(
  channel.getMotherboardSerial,
  withLog(async () => {
    // Ensure an error is thrown when the promise is rejected
    return await getMotherboardSerial();
  }),
);

ipcMain.handle(
  channel.verifyActivation,
  withLog(async (e, activateCode: string) => {
    // Prevent unused variable warning
    void e;
    const motherboardSerial = await getMotherboardSerial();
    const serial = getSerialFromStdout(motherboardSerial);
    if (!serial) {
      throw new Error("获取主板序列号失败");
    }
    const exceptedCode = createHash("md5")
      .update([serial, DATE_FORMAT_DATABASE].join(""))
      .digest("hex")
      .toUpperCase();

    return {
      isOk: activateCode === exceptedCode,
    };
  }),
);

ipcMain.handle(
  channel.autoInputToVC,
  withLog(async (e, data: AutoInputToVCParams) => {
    // Prevent unused variable warning
    void e;
    const cp = await execFileAsync(data.driverPath, [
      "autoInputToVC",
      data.zx,
      data.zh,
      data.czzzdw,
      data.sczzdw,
      data.mczzdw,
      dayjs(data.czzzrq).format("YYYYMM"),
      dayjs(data.sczzrq).format("YYYYMMDD"),
      dayjs(data.mczzrq).format("YYYYMMDD"),
      data.ztx,
      data.ytx,
    ]);

    if (cp.stderr) {
      throw cp.stderr;
    }

    return cp.stdout;
  }),
);

ipcMain.handle(
  channel.getDataFromAccessDatabase,
  withLog(async (e, params: GetDataFromAccessDatabaseParams) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await getDataFromAccessDatabase({
      driverPath: params.driverPath,
      databasePath: params.databasePath,
      sql: params.query,
    });
  }),
);

ipcMain.handle(
  channel.hxzy_hmis_get_data,
  withLog(async (e, params: hxzyHmis.GetRequest) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await hxzyHmis.getFn(params);
  }),
);

ipcMain.handle(
  channel.hxzy_hmis_save_data,
  withLog(async (e, params: hxzyHmis.SaveDataParams) => {
    // Prevent unused variable warning
    void e;
    const startDate = dayjs().startOf("day").toISOString();
    const endDate = dayjs().endOf("day").toISOString();
    const eq_ip = getIP();
    const corporation = await getCorporation({
      driverPath: params.driverPath,
      databasePath: params.databasePath,
    });

    const settledData = await Promise.allSettled(
      params.records.map((record) =>
        hxzyHmis.recordToSaveDataParams(
          record,
          eq_ip,
          corporation.DeviceNO || "",
          params.gd,
          startDate,
          endDate,
          params.driverPath,
          params.databasePath,
        ),
      ),
    );

    const data = settledData
      .filter((i) => i.status === "fulfilled")
      .map((i) => i.value);

    const dhs = data.map((i) => i.dh);

    if (!data.length) {
      throw `轴号[${params.records
        .map((record) => record.zh)
        .join(",")}],均未找到对应的记录`;
    }

    const result = await hxzyHmis.postFn({
      data,
      host: params.host,
    });

    return { result, dhs };
  }),
);

ipcMain.handle(
  channel.hxzy_hmis_upload_verifies,
  withLog(async (e, params: hxzyHmis.UploadVerifiesParams) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await hxzyHmis.idToUploadVerifiesData(
      params.id,
      params.driverPath,
      params.databasePath,
    );
  }),
);

ipcMain.handle(
  channel.jtv_hmis_get_data,
  withLog(async (e, params: jtvHmis.GetRequest) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await jtvHmis.getFn(params);
  }),
);

ipcMain.handle(
  channel.jtv_hmis_save_data,
  withLog(async (e, params: jtvHmis.SaveDataParams) => {
    // Prevent unused variable warning
    void e;
    const startDate = dayjs().startOf("day").toISOString();
    const endDate = dayjs().endOf("day").toISOString();
    const eq_ip = getIP();
    const corporation = await getCorporation({
      driverPath: params.driverPath,
      databasePath: params.databasePath,
    });

    const settledData = await Promise.allSettled(
      params.records.map((record) =>
        jtvHmis.recordToSaveDataParams(
          record,
          eq_ip,
          corporation.DeviceNO || "",
          startDate,
          endDate,
          params.driverPath,
          params.databasePath,
        ),
      ),
    );

    const data = settledData
      .filter((i) => i.status === "fulfilled")
      .map((i) => i.value);

    const dhs = data.map((i) => i.dh);

    if (!data.length) {
      throw `轴号[${params.records
        .map((record) => record.zh)
        .join(",")}],均未找到对应的记录`;
    }

    const result = await jtvHmis.postFn({
      data,
      host: params.host,
    });

    return { result, dhs };
  }),
);

ipcMain.handle(
  channel.jtv_hmis_xuzhoubei_get_data,
  withLog(async (e, params: jtvHmisXuzhoubei.GetRequest) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await jtvHmisXuzhoubei.getFn(params);
  }),
);

ipcMain.handle(
  channel.jtv_hmis_xuzhoubei_save_data,
  withLog(async (e, params: jtvHmisXuzhoubei.SaveDataParams) => {
    // Prevent unused variable warning
    void e;
    return await jtvHmisXuzhoubei.saveData(params);
  }),
);

ipcMain.handle(
  channel.kh_hmis_get_data,
  withLog(async (e, params: khHmis.GetRequest) => {
    // Prevent unused variable warning
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await khHmis.getFn(params);
  }),
);

ipcMain.handle(
  channel.kh_hmis_save_data,
  withLog(async (e, params: khHmis.SaveDataParams) => {
    // Prevent unused variable warning
    void e;
    return await khHmis.saveData(params);
  }),
);
