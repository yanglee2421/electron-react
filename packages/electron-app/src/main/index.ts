import { createSQLiteDB } from "#main/db";
import type { IpcHandle } from "#main/lib/ipc";
import { IPCHandle } from "#main/lib/ipc";
import * as mdb from "#main/modules/mdb";
import * as guangzhoubei from "#main/shared/factories/hmis/guangzhoubei";
import * as guangzhouJibaoduan from "#main/shared/factories/hmis/guangzhoujibaoduan";
import * as hxzy from "#main/shared/factories/hmis/hxzy";
import * as jtv from "#main/shared/factories/hmis/jtv";
import * as kh from "#main/shared/factories/hmis/kh_hmis";
import * as xuzhoubei from "#main/shared/factories/hmis/xuzhoubei";
import * as kv from "#main/shared/factories/KV";
import * as log from "#main/shared/factories/Logger";
import { Profile } from "#main/shared/factories/Profile";
import { electronApp, is, optimizer, platform } from "@electron-toolkit/utils";
import { asValue } from "awilix";
import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  nativeTheme,
  net,
  shell,
} from "electron";
import path from "node:path";
import url from "node:url";
import {
  defer,
  filter,
  from,
  fromEventPattern,
  map,
  of,
  partition,
  switchMap,
  take,
  tap,
} from "rxjs";
import { container } from "./features";
import * as cmdIPC from "./features/cmd/ipc";
import * as dbIPC from "./features/db/ipc";
import * as kvIPC from "./features/kv/ipc";
import * as mdbIPC from "./features/mdb/ipc";
import * as plcIPC from "./features/plc/ipc";
import * as profileIPC from "./features/profile/ipc";
import * as md5 from "./modules/image";
import * as xml from "./modules/xml";

if (is.dev) {
  const devUserDataPath = path.resolve(
    app.getPath("appData"),
    `./${app.getName()}-dev`,
  );
  app.setPath("userData", devUserDataPath);
}

// Define rxjs observable
const instanceLock$ = defer(() => of(app.requestSingleInstanceLock()));
const whenReady$ = from(app.whenReady());
const willQuit$ = fromEventPattern(
  (handler) => app.on("will-quit", handler),
  (handler) => app.off("will-quit", handler),
);
const activate$ = fromEventPattern(
  (handler) => app.on("activate", handler),
  (handler) => app.off("activate", handler),
);
const secondInstance$ = fromEventPattern(
  (handler) => app.on("second-instance", handler),
  (handler) => app.off("second-instance", handler),
);
const windowAllClosed$ = fromEventPattern(
  (handler) => app.on("window-all-closed", handler),
  (handler) => app.off("window-all-closed", handler),
);
const browserWindowCreated$ = fromEventPattern<[Electron.Event, BrowserWindow]>(
  (handler) => app.on("browser-window-created", handler),
  (handler) => app.off("browser-window-created", handler),
);
const [primaryInstance$, duplicateInstance$] = partition(
  instanceLock$,
  (hasLock) => hasLock,
);

duplicateInstance$.subscribe(() => {
  if (is.dev) {
    console.warn(
      "Another instance of the app is already running. This instance will be closed.",
    );
  }

  app.quit();
});

primaryInstance$
  .pipe(
    switchMap(() => whenReady$),
    map(() => {
      // =============
      // Dependency injection and module initialization
      // =============

      const dbPath = path.resolve(app.getPath("userData"), "db.db");

      container.register({ dbPath: asValue(dbPath) });

      const { cmd, db, kv, mdb, plc, profile } = container.cradle;

      const cmdUnIPC = cmdIPC.registerIPCHandlers(cmd);
      const dbUnIPC = dbIPC.registerIPCHandlers(db);
      const kvUnIPC = kvIPC.registerIPCHandlers(kv);
      const mdbUnIPC = mdbIPC.registerIPCHandlers(mdb);
      const plcUnIPC = plcIPC.bindIpcHandlers(plc);
      const profileUnIPC = profileIPC.registerIPCHandlers(profile);

      return [
        () => {
          db.dispose();
        },
        cmdUnIPC,
        dbUnIPC,
        kvUnIPC,
        mdbUnIPC,
        plcUnIPC,
        profileUnIPC,
      ];
    }),
    tap(() => {
      const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
      const migrationsFolder = path.resolve(__dirname, "../../drizzle");
      const { db, profile } = container.cradle;

      db.migrate(migrationsFolder);
      profile.state$.subscribe((state) => {
        nativeTheme.themeSource = state.mode;

        BrowserWindow.getAllWindows().forEach((win) => {
          win.setAlwaysOnTop(state.alwaysOnTop);
        });
      });
    }),
  )
  .subscribe((cleanups) => {
    Menu.setApplicationMenu(null);

    if (platform.isWindows) {
      // Set app user model id for windows
      electronApp.setAppUserModelId("com.electron");
    }

    void bootstrap();
    void createWindow();

    willQuit$
      .pipe(
        filter(() => !platform.isMacOS),
        take(1),
      )
      .subscribe(() => {
        cleanups.forEach((cleanup) => cleanup());
      });
  });

activate$
  .pipe(filter(() => BrowserWindow.getAllWindows().length === 0))
  .subscribe(() => {
    void createWindow();
  });

secondInstance$.subscribe(() => {
  const win = BrowserWindow.getAllWindows().at(0);
  if (!win) return;

  if (win.isMinimized()) {
    win.restore();
  }

  win.focus();
});

windowAllClosed$.pipe(filter(() => !platform.isMacOS)).subscribe(() => {
  app.quit();
});

browserWindowCreated$.subscribe((args) => {
  const [, win] = args;

  optimizer.watchWindowShortcuts(win);

  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: "deny" };
  });

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
});

const createWindow = async () => {
  const { profile } = container.cradle;
  const alwaysOnTop = profile.state.alwaysOnTop;

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

  // Adding ready-to-show listener must be before loadURL or loadFile
  const readyToShow$ = fromEventPattern(
    (handler) => win.once("ready-to-show", handler),
    (handler) => win.off("ready-to-show", handler),
  );

  readyToShow$.pipe(take(1)).subscribe(() => {
    win.show();
  });

  const ELECTRON_RENDERER_URL = is.dev
    ? process.env["ELECTRON_RENDERER_URL"]!
    : path.join(__dirname, "../renderer/index.html");

  await win.loadURL(ELECTRON_RENDERER_URL);
};

const bindIpcHandles = (ipcHandle: IpcHandle) => {
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
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const databasePath = path.resolve(app.getPath("userData"), "db.db");
  const sqliteDB = createSQLiteDB({
    databasePath,
    migrationsFolder: path.resolve(__dirname, "../../drizzle"),
  });
  const kvInstance = new kv.KV(sqliteDB);
  const profile = new Profile(kvInstance);
  const mdbDB = new mdb.MDBDB(profile);
  const logger = new log.Logger(sqliteDB);
  const hxzyHmis = new hxzy.Hxzy(sqliteDB, kvInstance, mdbDB, net, logger);
  const khHmis = new kh.KH(sqliteDB, kvInstance, mdbDB, net, logger);
  const jtvHmis = new jtv.JTV(sqliteDB, kvInstance, mdbDB, net, logger);
  const xuzhoubeiHmis = new xuzhoubei.Xuzhoubei(
    sqliteDB,
    kvInstance,
    mdbDB,
    net,
    logger,
  );
  const guangzhoubeiHmis = new guangzhoubei.Guangzhoubei(
    sqliteDB,
    kvInstance,
    mdbDB,
    net,
    logger,
  );
  const jtv_hmis_guangzhoujibaoduan =
    new guangzhouJibaoduan.JTV_HMIS_Guangzhoujibaoduan(
      sqliteDB,
      kvInstance,
      mdbDB,
      net,
      logger,
    );
  const imageModule = new md5.ImageModule();

  await hydrateModules(
    profile,
    jtv_hmis_guangzhoujibaoduan,
    hxzyHmis,
    khHmis,
    jtvHmis,
  );

  const ipch = new IPCHandle(logger);
  const ipcHandle = ipch.handle.bind(ipch);

  logger.on(() => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("logUpdated");
    });
  });

  bindIpcHandles(ipcHandle);

  mdb.bindIpcHandlers(mdbDB, ipcHandle);
  md5.bindIpcHandlers(imageModule, ipcHandle);
  xml.bindIpcHandlers(ipcHandle);
  log.bindIPC(logger, ipcHandle);
  kh.bindIpcHandlers(khHmis, ipcHandle);
  jtv.bindIpcHandlers(jtvHmis, ipcHandle);
  hxzy.bindIPCHandlers(hxzyHmis, ipcHandle);
  xuzhoubei.bindIpcHandlers(xuzhoubeiHmis, ipcHandle);
  guangzhoubei.bindIpcHandlers(guangzhoubeiHmis, ipcHandle);
  guangzhouJibaoduan.bindIpc(jtv_hmis_guangzhoujibaoduan, ipcHandle);
};
