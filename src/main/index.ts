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
import {
  BrowserWindow,
  ipcMain,
  nativeTheme,
  app,
  Menu,
  dialog,
} from "electron";
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

const createWindow = async () => {
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
    show: false,
  });

  win.menuBarVisible = false;

  win.on("focus", () => {
    win.webContents.send(channel.windowFocus);
  });
  win.on("blur", () => {
    win.webContents.send(channel.windowBlur);
  });
  // Only fire when the win.show is called on Windows
  win.on("show", () => {
    win.webContents.send(channel.windowShow);
  });
  // Only fire when the win.hide is called on Windows
  win.on("hide", () => {
    win.webContents.send(channel.windowHide);
  });

  win.webContents.on("did-finish-load", () => {
    win.webContents.send(channel.windowShow);
  });

  // Adding ready-to-show listener must be before loadURL or loadFile
  win.once("ready-to-show", () => win.show());

  if (!is.dev) {
    await win.loadFile(join(__dirname, "../renderer/index.html"));
    return;
  }

  const ELECTRON_RENDERER_URL = process.env["ELECTRON_RENDERER_URL"];

  if (!ELECTRON_RENDERER_URL) {
    await dialog.showMessageBox({
      title: "错误",
      message: "环境变量ELECTRON_RENDERER_URL不是一个有效的URL",
      type: "error",
    });

    return;
  }

  await win.loadURL(ELECTRON_RENDERER_URL);
};

const bindAppHandler = () => {
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const isSingleInstance = app.requestSingleInstanceLock();
  if (!isSingleInstance) return;

  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) return;

    // Someone tried to run a second instance, we should focus our window.
    if (win.isMinimized()) {
      win.restore();
    }

    win.focus();
  });
};

const bindIpcHandler = () => {
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
};

const runApp = async () => {
  /**
   * Performace optimization
   * https://www.electronjs.org/docs/latest/tutorial/performance#8-call-menusetapplicationmenunull-when-you-do-not-need-a-default-menu
   */
  Menu.setApplicationMenu(null);

  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Set app theme mode
  const mode = store.settings.get("mode");
  nativeTheme.themeSource = mode;

  bindAppHandler();
  bindIpcHandler();
  hxzyHmis.init();
  jtvHmisXuzhoubei.init();
  jtvHmis.init();
  khHmis.init();
  cmd.initIpc();
  store.init();
  windows.initIpc();
  excel.initIpc();

  await app.whenReady();
  await createWindow();
};

runApp();
