/**
 * Main Process Entry Point
 *
 * The main process is the core process of an Electron application, responsible for:
 * - Application lifecycle management
 * - Creating and managing renderer processes
 * - Accessing native system functionality
 * - Coordinating inter-process communication
 *
 * Note:
 * - electron/renderer: Available in the renderer process
 * - electron/main: Not available in the renderer process
 * - electron/common: Available in the renderer process (non-sandboxed only)
 */
import { BrowserWindow, ipcMain, nativeTheme, app, Menu } from "electron";
import { shell } from "electron/common";
import { join } from "node:path";
import * as channel from "./channel";
import { withLog } from "./lib";
import * as windows from "./win";
import * as hxzyHmis from "./hxzy_hmis";
import * as jtvHmis from "./jtv_hmis";
import * as jtvHmisXuzhoubei from "./jtv_hmis_xuzhoubei";
import * as khHmis from "./kh_hmis";
import * as store from "./store";
import * as cmd from "./cmd";
import * as excel from "./xlsx";
import { is, optimizer, electronApp } from "@electron-toolkit/utils";

const createWindow = () => {
  const alwaysOnTop = store.settings.get("alwaysOnTop");

  const win = new BrowserWindow({
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      nodeIntegration: false,
      sandbox: false,
    },

    autoHideMenuBar: false,
    alwaysOnTop,

    width: 1024,
    height: 768,
    minWidth: 500,
    // show: false,
  });

  /**
   * Performace optimization
   * https://www.electronjs.org/docs/latest/tutorial/performance#8-call-menusetapplicationmenunull-when-you-do-not-need-a-default-menu
   */
  Menu.setApplicationMenu(null);
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

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
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
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) return;

    // Someone tried to run a second instance, we should focus our window.
    if (win.isMinimized()) {
      win.restore();
    }

    win.focus();
  });

  if (import.meta.env.DEV) {
    // Disable hardware acceleration to avoid the black screen issue on Windows.
    // app.disableHardwareAcceleration();
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.whenReady().then(async () => {
    const mode = store.settings.get("mode");
    nativeTheme.themeSource = mode;
    hxzyHmis.init();
    jtvHmisXuzhoubei.init();
    jtvHmis.init();
    khHmis.init();
    cmd.initIpc();
    store.init();
    windows.initIpc();
    excel.initIpc();

    createWindow();
  });
}

ipcMain.handle(
  channel.getVersion,
  withLog(async (): Promise<string> => app.getVersion()),
);

ipcMain.handle(
  channel.openAtLogin,
  withLog(async (e, openAtLogin?: boolean): Promise<boolean> => {
    void e;

    if (typeof openAtLogin === "boolean") {
      app.setLoginItemSettings({ openAtLogin });
    }

    return app.getLoginItemSettings().launchItems.some((i) => i.enabled);
  }),
);

ipcMain.handle(
  channel.openDevTools,
  withLog(async (): Promise<void> => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) return;
    win.webContents.openDevTools();
  }),
);

ipcMain.handle(
  channel.openPath,
  withLog(async (e, path: string): Promise<string> => {
    // Prevent unused variable error
    void e;
    const data = await shell.openPath(path);
    return data;
  }),
);

ipcMain.handle(
  channel.mem,
  withLog(async (): Promise<{ totalmem: number; freemem: number }> => {
    const processMemoryInfo = await process.getProcessMemoryInfo();
    const freemem = processMemoryInfo.residentSet;

    return {
      totalmem: process.getSystemMemoryInfo().total,
      freemem,
    };
  }),
);

ipcMain.handle(
  channel.mobileMode,
  withLog(async (e, mobile: boolean): Promise<boolean> => {
    void e;

    BrowserWindow.getAllWindows().forEach((win) => {
      if (mobile) {
        win.setSize(500, 800);
      } else {
        win.setSize(1024, 768);
      }
      win.center();
    });

    return mobile;
  }),
);
