import { createSQLiteDB } from "#main/db";
import { ipcHandle } from "#main/lib/ipc";
import { MDBDB } from "#main/modules/mdb";
import * as guangzhoubei from "#main/shared/factories/hmis/guangzhoubei";
import * as guangzhouJibaoduan from "#main/shared/factories/hmis/guangzhoujibaoduan";
import * as hxzy from "#main/shared/factories/hmis/hxzy";
import * as jtv from "#main/shared/factories/hmis/jtv";
import * as kh from "#main/shared/factories/hmis/kh_hmis";
import * as xuzhoubei from "#main/shared/factories/hmis/xuzhoubei";
import { bindIpc, KV } from "#main/shared/factories/KV";
import { Profile } from "#main/shared/factories/Profile";
import type { ThemeMode } from "#shared/instances/schema";
import { electronApp, is, optimizer, platform } from "@electron-toolkit/utils";
import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  nativeTheme,
  net,
  protocol,
  shell,
} from "electron";
import path from "node:path";
import url from "node:url";
import * as cmd from "./modules/cmd";
import * as md5 from "./modules/image";
import * as plc from "./modules/plc";
import * as xml from "./modules/xml";

const createWindow = async (alwaysOnTop: boolean) => {
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
    void shell.openExternal(details.url);
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

const bindAppEventListeners = (profile: Profile) => {
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
      void createWindow(profile.getState().alwaysOnTop);
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

const bindIpcHandles = () => {
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

interface HydratableModule {
  hydrate: () => Promise<void>;
}

const hydrateModules = async (...modules: HydratableModule[]) => {
  await Promise.allSettled(modules.map((module) => module.hydrate()));
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

  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const sqliteDB = createSQLiteDB({
    databasePath: path.resolve(app.getPath("userData"), "db.db"),
    migrationsFolder: path.resolve(__dirname, "../../drizzle"),
  });
  const kv = new KV(sqliteDB);
  const profile = new Profile(kv);
  const mdbDB = new MDBDB(profile);

  const hxzyHmis = new hxzy.Hxzy(sqliteDB, kv, mdbDB, net);
  const khHmis = new kh.KH(sqliteDB, kv, mdbDB, net);
  const jtvHmis = new jtv.JTV(sqliteDB, kv, mdbDB, net);
  const xuzhoubeiHmis = new xuzhoubei.Xuzhoubei(sqliteDB, kv, mdbDB, net);
  const guangzhoubeiHmis = new guangzhoubei.Guangzhoubei(
    sqliteDB,
    kv,
    mdbDB,
    net,
  );
  const jtv_hmis_guangzhoujibaoduan =
    new guangzhouJibaoduan.JTV_HMIS_Guangzhoujibaoduan(
      sqliteDB,
      kv,
      mdbDB,
      net,
    );

  await hydrateModules(
    profile,
    jtv_hmis_guangzhoujibaoduan,
    hxzyHmis,
    khHmis,
    jtvHmis,
  );

  nativeTheme.themeSource = profile.getState().mode;

  bindAppEventListeners(profile);
  bindIpcHandles();

  mdbDB.bindIpcHandlers();
  cmd.bindIpcHandlers(ipcHandle);
  plc.bindIpcHandlers(ipcHandle);
  md5.bindIpcHandlers();
  xml.bindIpcHandlers();

  bindIpc(kv, ipcHandle);
  kh.bindIpcHandlers(khHmis, ipcHandle);
  jtv.bindIpcHandlers(jtvHmis, ipcHandle);
  hxzy.bindIPCHandlers(hxzyHmis, ipcHandle);
  xuzhoubei.bindIpcHandlers(xuzhoubeiHmis, ipcHandle);
  guangzhoubei.bindIpcHandlers(guangzhoubeiHmis, ipcHandle);
  guangzhouJibaoduan.bindIpc(jtv_hmis_guangzhoujibaoduan, ipcHandle);

  profile.on((state, previous) => {
    diffMode(previous.mode, state.mode);
    diffAlwaysOnTop(previous.alwaysOnTop, state.alwaysOnTop);
    diffAppPath(previous.appPath, state.appPath, profile);
  });

  await createWindow(profile.getState().alwaysOnTop);
};

void bootstrap();

const diffMode = (prev: ThemeMode, next: ThemeMode) => {
  if (Object.is(prev, next)) return;

  nativeTheme.themeSource = next;
};

const diffAlwaysOnTop = (prev: boolean, next: boolean) => {
  if (Object.is(prev, next)) return;

  BrowserWindow.getAllWindows().forEach((win) => {
    win.setAlwaysOnTop(next);
  });
};

const diffAppPath = (prev: string, next: string, profile: Profile) => {
  if (Object.is(prev, next)) return;

  if (protocol.isProtocolHandled("atom")) {
    protocol.unhandle("atom");
  }

  protocol.handle("atom", async (request) => {
    const fileName = request.url.replace(/^atom:\/\//, "");
    const rootPath = await profile.getRootPath();
    const fetchURL = path.join(rootPath, "_data", fileName);

    return net.fetch(`file://${fetchURL}`);
  });
};
