import { app, BrowserWindow, ipcMain, nativeTheme, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import * as channel from "./channel";
import { withLog, getSerialFromStdout } from "./lib";
import { getCpuSerial, runWinword } from "./win";
import { DATE_FORMAT_DATABASE } from "./cmd";
import * as hxzyHmis from "./hxzy_hmis";
import * as jtvHmis from "./jtv_hmis";
import * as jtvHmisXuzhoubei from "./jtv_hmis_xuzhoubei";
import * as khHmis from "./kh_hmis";
import * as store from "./store";
import * as cmd from "./cmd";
import type * as PRELOAD from "./preload";

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

if (import.meta.env.DEV) {
  console.log(app.getPath("userData"));
}

let win: BrowserWindow | null;

const createWindow = () => {
  const alwaysOnTop = store.settings.get("alwaysOnTop");

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: false,
    },

    autoHideMenuBar: false,
    alwaysOnTop,

    width: 1024,
    height: 768,
    // show: false,
  });

  win.menuBarVisible = false;

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {});
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
};

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
    const mode = store.settings.get("mode");
    nativeTheme.themeSource = mode;
    hxzyHmis.init();
    jtvHmisXuzhoubei.init();
    jtvHmis.init();
    khHmis.init();
    cmd.initIpc();
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
  channel.getVersion,
  withLog(async () => app.getVersion()),
);

ipcMain.handle(
  channel.printer,
  withLog(async (e, data: string) => {
    void e;
    // Ensure an error is thrown when the promise is rejected
    return await runWinword(data).catch(() => shell.openPath(data));
  }),
);

ipcMain.handle(
  channel.verifyActivation,
  withLog(async () => {
    const cpuSerial = await getCpuSerial();
    const serial = getSerialFromStdout(cpuSerial);
    const activateCode = store.settings.get("activateCode");
    if (!activateCode) return { isOk: false, serial };
    if (!serial) throw new Error("获取CPU序列号失败");
    const exceptedCode = createHash("md5")
      .update([serial, DATE_FORMAT_DATABASE].join(""))
      .digest("hex")
      .toUpperCase();

    return { isOk: activateCode === exceptedCode, serial };
  }),
);

// 合并两个处理器为一个，根据是否有参数来决定是获取还是设置
ipcMain.handle(
  channel.settings,
  withLog(async (e, data?: PRELOAD.SetSettingParams) => {
    void e;
    if (data) {
      store.settings.set(data);
    }
    return store.settings.store;
  }),
);
