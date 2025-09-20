import {
  BrowserWindow,
  nativeTheme,
  app,
  Menu,
  dialog,
  shell,
  protocol,
  net,
} from "electron";
import { join } from "node:path";
import { channel } from "./channel";
import { ipcHandle } from "./lib";
import * as hxzyHmis from "./hxzy_hmis";
import * as jtvHmis from "./jtv_hmis";
import * as jtvHmisXuzhoubei from "./jtv_hmis_xuzhoubei";
import * as khHmis from "./kh_hmis";
import * as cmd from "./cmd";
import * as excel from "./xlsx";
import { is, optimizer, electronApp } from "@electron-toolkit/utils";
import * as mdb from "./mdb";
import * as profile from "./profile";

const createWindow = async (alwaysOnTop: boolean) => {
  const win = new BrowserWindow({
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      nodeIntegration: false,
      sandbox: false,
    },

    autoHideMenuBar: false,
    alwaysOnTop,

    // width: 1024,
    // height: 768,
    // minWidth: 500,
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
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
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
  app.on("activate", async () => {
    const profileInfo = await profile.getProfile();
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(profileInfo.alwaysOnTop);
    }
  });

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  /**
   * @description true: No other instances exist
   * @description false: Other instances exist
   */
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    return;
  }

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
  ipcHandle(channel.VERSION, async () => ({
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    v8Version: process.versions.v8,
  }));

  ipcHandle(
    channel.openAtLogin,
    async (_, openAtLogin?: boolean): Promise<boolean> => {
      if (typeof openAtLogin === "boolean") {
        app.setLoginItemSettings({ openAtLogin });
      }
      return app.getLoginItemSettings().launchItems.some((i) => i.enabled);
    },
  );

  ipcHandle(channel.openDevTools, async (): Promise<void> => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) return;
    win.webContents.openDevTools();
  });

  ipcHandle(channel.openPath, async (_, path: string): Promise<string> => {
    const data = await shell.openPath(path);
    return data;
  });

  ipcHandle(
    channel.mobileMode,
    async (_, mobile: boolean): Promise<boolean> => {
      BrowserWindow.getAllWindows().forEach((win) => {
        if (mobile) {
          win.setSize(500, 800);
        } else {
          win.setSize(1024, 768);
        }
        win.center();
      });
      return mobile;
    },
  );

  ipcHandle(channel.SELECT_DIRECTORY, async () => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) throw new Error("No active window");
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    return result.filePaths;
  });

  ipcHandle(channel.SELECT_FILE, async (_, filters: Electron.FileFilter[]) => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) throw new Error("No active window");
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters,
    });
    return result.filePaths;
  });
};

const bindProtocol = () => {
  protocol.handle("atom", async (request) => {
    const fileName = request.url.replace(/^atom:\/\//, "");
    const profileInfo = await profile.getRootPath();
    const fetchURL = join(profileInfo, "_data", fileName);
    return net.fetch(`file://${fetchURL}`);
  });
};

const bootstrap = async () => {
  /**
   * Performace optimization
   * @link https://www.electronjs.org/docs/latest/tutorial/performance#8-call-menusetapplicationmenunull-when-you-do-not-need-a-default-menu
   */
  Menu.setApplicationMenu(null);

  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Set app theme mode
  const profileInfo = await profile.getProfile();
  nativeTheme.themeSource = profileInfo.mode;

  bindAppHandler();
  bindIpcHandler();
  hxzyHmis.init();
  jtvHmisXuzhoubei.init();
  jtvHmis.init();
  khHmis.init();
  cmd.initIpc();
  excel.initIpc();
  mdb.init();
  profile.bindIpcHandler();
  bindProtocol();

  await app.whenReady();
  await createWindow(profileInfo.alwaysOnTop);
};

bootstrap();
