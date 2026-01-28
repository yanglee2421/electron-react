import * as path from "node:path";
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
import { is, optimizer, electronApp, platform } from "@electron-toolkit/utils";
import { channel } from "#main/channel";
import { ipcHandle } from "#main/lib";
import * as profile from "#main/lib/profile";
import * as hxzyHmis from "./modules/hmis/hxzy_hmis";
import * as jtvHmis from "./modules/hmis/jtv_hmis";
import * as jtvHmisGuangzhoubei from "./modules/hmis/jtv_hmis_guangzhoubei";
import * as jtvHmisXuzhoubei from "./modules/hmis/jtv_hmis_xuzhoubei";
import * as khHmis from "./modules/hmis/kh_hmis";
import * as cmd from "./modules/cmd";
import * as excel from "./modules/xlsx";
import * as mdb from "./modules/mdb";
import * as md5 from "./modules/image";
import * as xml from "./modules/xml";
import * as plc from "./modules/plc";

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

  ipcHandle(channel.openAtLogin, async (_, openAtLogin?: boolean) => {
    if (platform.isLinux) {
      return false;
    }

    if (typeof openAtLogin === "boolean") {
      return electronApp.setAutoLaunch(openAtLogin);
    }

    return app.getLoginItemSettings().openAtLogin;
  });

  ipcHandle(channel.openDevTools, async () => {
    const win = BrowserWindow.getAllWindows().at(0);
    if (!win) return;
    win.webContents.openDevTools();
  });

  ipcHandle(channel.openPath, async (_, path: string) => {
    const data = await shell.openPath(path);
    return data;
  });

  ipcHandle(channel.mobileMode, async (_, mobile: boolean) => {
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

  ipcHandle(
    channel.SHOW_OPEN_DIALOG,
    async (_, options: Electron.OpenDialogOptions) => {
      const win = BrowserWindow.getAllWindows().at(0);
      if (!win) throw new Error("No active window");
      const result = await dialog.showOpenDialog(win, options);
      return result.filePaths;
    },
  );
};

const bindProtocol = () => {
  protocol.handle("atom", async (request) => {
    const fileName = request.url.replace(/^atom:\/\//, "");
    const profileInfo = await profile.getRootPath();
    const fetchURL = path.join(profileInfo, "_data", fileName);
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
  await app.whenReady();

  bindAppHandler();
  bindIpcHandler();
  bindProtocol();
  hxzyHmis.init();
  jtvHmisXuzhoubei.init();
  jtvHmis.init();
  jtvHmisGuangzhoubei.init();
  khHmis.init();
  cmd.initIpc();
  excel.initIpc();
  mdb.init();
  profile.bindIpcHandler();
  md5.bindIpcHandler();
  xml.bindIpcHandler();
  plc.bindIpcHandler();

  await createWindow(profileInfo.alwaysOnTop);
};

bootstrap();
