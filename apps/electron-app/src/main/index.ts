import * as path from "node:path";
import { BrowserWindow, nativeTheme, app, Menu, dialog, shell } from "electron";
import { is, optimizer, electronApp, platform } from "@electron-toolkit/utils";
import { createSQLiteDB } from "#main/lib";
import { ipcHandle } from "#main/lib/ipc";
import * as hxzyHmis from "./modules/hmis/hxzy_hmis";
import * as jtvHmis from "./modules/hmis/jtv_hmis";
import * as jtvHmisGuangzhoubei from "./modules/hmis/jtv_hmis_guangzhoubei";
import * as jtvHmisXuzhoubei from "./modules/hmis/jtv_hmis_xuzhoubei";
import * as khHmis from "./modules/hmis/kh_hmis";
import * as cmd from "./modules/cmd";
import * as excel from "./modules/xlsx";
import { MDBDB } from "#main/modules/mdb";
import { ProfileStore } from "#main/lib/profile";
import * as md5 from "./modules/image";
import * as xml from "./modules/xml";
import * as plc from "./modules/plc";
import { createStores } from "./lib/store";

export type AppContext = {
  profile: ProfileStore;
  mdbDB: MDBDB;
  sqliteDB: ReturnType<typeof createSQLiteDB>;

  kh_hmis: ReturnType<typeof createStores>["kh_hmis"];
  hxzy_hmis: ReturnType<typeof createStores>["hxzy_hmis"];
  jtv_hmis: ReturnType<typeof createStores>["jtv_hmis"];
  jtv_hmis_xuzhoubei: ReturnType<typeof createStores>["jtv_hmis_xuzhoubei"];
  jtv_hmis_guangzhoubei: ReturnType<
    typeof createStores
  >["jtv_hmis_guangzhoubei"];
};

const createWindow = async (appContext: AppContext) => {
  const { profile } = appContext;

  const profileInfo = await profile.getState();
  const alwaysOnTop = profileInfo.alwaysOnTop;

  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.mjs"),
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
    },

    autoHideMenuBar: false,
    alwaysOnTop,

    width: 1024,
    height: 768,
    minWidth: 380,
    show: false,
  });

  win.menuBarVisible = false;

  win.on("focus", () => {
    win.webContents.send("windowFocus");
  });
  win.on("blur", () => {
    win.webContents.send("windowBlur");
  });
  // Only fire when the win.show is called on Windows
  win.on("show", () => {
    win.webContents.send("windowShow");
  });
  // Only fire when the win.hide is called on Windows
  win.on("hide", () => {
    win.webContents.send("windowHide");
  });

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("windowShow");
  });
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // Adding ready-to-show listener must be before loadURL or loadFile
  win.once("ready-to-show", () => win.show());

  if (!is.dev) {
    await win.loadFile(path.join(__dirname, "../renderer/index.html"));
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

const bindAppEventListeners = (appContext: AppContext) => {
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
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(appContext);
    }
  });

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

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

const bindIpcHandles = (_: AppContext) => {
  void _;

  ipcHandle("VERSION/GET", async () => ({
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
    v8Version: process.versions.v8,
  }));

  ipcHandle("APP/OPEN_AT_LOGIN", async (_, openAtLogin?: boolean) => {
    if (platform.isLinux) {
      return false;
    }

    if (typeof openAtLogin === "boolean") {
      return electronApp.setAutoLaunch(openAtLogin);
    }

    return app.getLoginItemSettings().openAtLogin;
  });

  ipcHandle("APP/OPEN_DEV_TOOLS", async () => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) return;
    win.webContents.openDevTools();
  });

  ipcHandle("APP/OPEN_PATH", async (_, path: string) => {
    const data = await shell.openPath(path);
    return data;
  });

  ipcHandle("APP/MOBILE_MODE", async (_, mobile: boolean) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (mobile) {
        win.setSize(500, 800);
      } else {
        win.setSize(1024, 768);
      }
      win.center();
    });
    return mobile;
  });

  ipcHandle("APP/SELECT_DIRECTORY", async () => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) throw new Error("No active window");
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    return result.filePaths;
  });

  ipcHandle("APP/SELECT_FILE", async (_, filters: Electron.FileFilter[]) => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) throw new Error("No active window");
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile"],
      filters,
    });
    return result.filePaths;
  });

  ipcHandle(
    "APP/SHOW_OPEN_DIALOG",
    async (_, options: Electron.OpenDialogOptions) => {
      const win = BrowserWindow.getAllWindows().at(0);
      if (!win) throw new Error("No active window");
      const result = await dialog.showOpenDialog(win, options);
      return result.filePaths;
    },
  );
};

const bootstrap = async () => {
  if (import.meta.env.DEV) {
    app.setPath(
      "userData",
      path.resolve(app.getPath("appData"), `./${app.getName()}-dev`),
    );
  }

  /**
   * @description true: No other instances exist
   * @description false: Other instances exist
   */
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    if (import.meta.env.DEV) {
      console.warn("Other instances exist");
    }

    app.quit();
    return;
  }

  /**
   * Performace optimization
   * @link https://www.electronjs.org/docs/latest/tutorial/performance#8-call-menusetapplicationmenunull-when-you-do-not-need-a-default-menu
   */
  Menu.setApplicationMenu(null);

  if (platform.isWindows) {
    // Set app user model id for windows
    electronApp.setAppUserModelId("com.electron");
  }

  await app.whenReady();

  const profileFilePath = path.resolve(app.getPath("userData"), "profile.json");
  const profile = new ProfileStore(profileFilePath);
  const mdbDB = new MDBDB(profile);
  const sqliteDB = createSQLiteDB();
  const {
    kh_hmis,
    hxzy_hmis,
    jtv_hmis,
    jtv_hmis_xuzhoubei,
    jtv_hmis_guangzhoubei,
  } = createStores();

  const appContext = {
    profile,
    mdbDB,
    sqliteDB,
    kh_hmis,
    hxzy_hmis,
    jtv_hmis,
    jtv_hmis_xuzhoubei,
    jtv_hmis_guangzhoubei,
  };

  const profileInfo = await profile.getState();

  nativeTheme.themeSource = profileInfo.mode;

  bindAppEventListeners(appContext);
  bindIpcHandles(appContext);

  profile.bindIpcHandlers(appContext);
  mdbDB.bindIpcHandlers();

  hxzyHmis.bindIPCHandlers(appContext);
  jtvHmisXuzhoubei.bindIpcHandlers(appContext);
  jtvHmis.bindIpcHandlers(appContext);
  jtvHmisGuangzhoubei.bindIpcHandlers(appContext);
  khHmis.bindIpcHandlers(appContext);

  cmd.bindIpcHandlers(appContext);
  excel.bindIpcHandlers(appContext);
  md5.bindIpcHandlers(appContext);
  xml.bindIpcHandlers(appContext);
  plc.bindIpcHandlers(appContext);

  await createWindow(appContext);
};

bootstrap();
