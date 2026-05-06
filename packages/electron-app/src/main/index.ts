import { electronApp, is, optimizer, platform } from "@electron-toolkit/utils";
import { asValue } from "awilix";
import { app, BrowserWindow, Menu, nativeTheme, shell } from "electron";
import path from "node:path";
import url from "node:url";
import {
  defer,
  filter,
  from,
  fromEventPattern,
  NEVER,
  of,
  partition,
  startWith,
  switchMap,
  take,
  using,
} from "rxjs";
import { container } from "./features";
import * as cmdIPC from "./features/cmd/ipc";
import * as dbIPC from "./features/db/ipc";
import * as guangzhoubeiIPC from "./features/guangzhoubei/ipc";
import * as guangzhoujibaoduanIPC from "./features/guangzhoujibaoduan/ipc";
import * as imageIPC from "./features/image/ipc";
import * as jtvIPC from "./features/jtv/ipc";
import * as kvIPC from "./features/kv/ipc";
import * as logIPC from "./features/logger/ipc";
import * as mdbIPC from "./features/mdb/ipc";
import * as plcIPC from "./features/plc/ipc";
import * as profileIPC from "./features/profile/ipc";
import * as xmlIPC from "./features/xml/ipc";
import * as infraIPC from "./infra/ipc";

if (is.dev) {
  const devUserDataPath = path.resolve(
    app.getPath("appData"),
    `./${app.getName()}-dev`,
  );
  app.setPath("userData", devUserDataPath);
}

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

// Define rxjs observable
const singleInstanceLock$ = defer(() => of(app.requestSingleInstanceLock()));
const [primaryInstance$, duplicateInstance$] = partition(
  singleInstanceLock$,
  (hasLock) => hasLock,
);
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
const browserWindowCreated$ = fromEventPattern<[Electron.Event, BrowserWindow]>(
  (handler) => app.on("browser-window-created", handler),
  (handler) => app.off("browser-window-created", handler),
);
const windowAllClosed$ = fromEventPattern(
  (handler) => app.on("window-all-closed", handler),
  (handler) => app.off("window-all-closed", handler),
);
const using$ = using(
  () => {
    const dbPath = path.resolve(app.getPath("userData"), "db.db");
    container.register({ dbPath: asValue(dbPath) });

    const { db } = container.cradle;
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const migrationsFolder = path.resolve(__dirname, "../../drizzle");
    db.migrate(migrationsFolder);

    const {
      cmd,
      kv,
      mdb,
      plc,
      profile,
      guangzhoubei,
      guangzhoujibaoduan,
      jtv,
      image,
      logger,
    } = container.cradle;
    const cmdUnIPC = cmdIPC.registerIPCHandlers(cmd);
    const dbUnIPC = dbIPC.registerIPCHandlers(db);
    const guangzhoubeiUnIPC = guangzhoubeiIPC.registerIPCHandlers(guangzhoubei);
    const guangzhoujibaoduanUnIPC =
      guangzhoujibaoduanIPC.registerIPCHandlers(guangzhoujibaoduan);
    const jtvUnIPC = jtvIPC.registerIPCHandlers(jtv);
    const imageUnIPC = imageIPC.registerIPCHandlers(image);
    const kvUnIPC = kvIPC.registerIPCHandlers(kv);
    const logUnIPC = logIPC.registerIPCHandlers(logger);
    const mdbUnIPC = mdbIPC.registerIPCHandlers(mdb);
    const plcUnIPC = plcIPC.registerIPCHandlers(plc);
    const profileUnIPC = profileIPC.registerIPCHandlers(profile);
    const xmlUnIPC = xmlIPC.registerIPCHandlers();
    const infraUnIPC = infraIPC.registerIPCHandlers();

    const profileSubscription = profile.state$.subscribe((state) => {
      nativeTheme.themeSource = state.mode;

      BrowserWindow.getAllWindows().forEach((win) => {
        win.setAlwaysOnTop(state.alwaysOnTop);
      });
    });

    const loggerSubscription = logger.event$.subscribe(() => {
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send("logUpdated");
      });
    });

    return {
      unsubscribe: () => {
        cmdUnIPC();
        dbUnIPC();
        guangzhoubeiUnIPC();
        guangzhoujibaoduanUnIPC();
        jtvUnIPC();
        imageUnIPC();
        kvUnIPC();
        logUnIPC();
        mdbUnIPC();
        plcUnIPC();
        profileUnIPC();
        xmlUnIPC();
        infraUnIPC();

        container.dispose();
        profileSubscription.unsubscribe();
        loggerSubscription.unsubscribe();
      },
    };
  },
  // Must emit a value to trigger the callback function that pass to subscribe,
  // but we don't actually need it
  () => NEVER.pipe(startWith(null)),
);

duplicateInstance$.subscribe(() => {
  if (is.dev) {
    console.warn(
      "Another instance of the app is already running. This instance will be closed.",
    );
  }

  app.quit();
});

const primarySubscription = primaryInstance$
  .pipe(
    switchMap(() => whenReady$),
    switchMap(() => using$),
  )
  .subscribe(() => {
    Menu.setApplicationMenu(null);

    if (platform.isWindows) {
      electronApp.setAppUserModelId("com.electron");
    }

    void createWindow();
  });

willQuit$.pipe(take(1)).subscribe(() => {
  primarySubscription.unsubscribe();
});

activate$
  .pipe(filter(() => BrowserWindow.getAllWindows().length === 0))
  .subscribe(() => createWindow());

secondInstance$.subscribe(() => {
  const win = BrowserWindow.getAllWindows().at(0);
  if (!win) return;

  if (win.isMinimized()) {
    win.restore();
  }

  win.focus();
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

windowAllClosed$.pipe(filter(() => !platform.isMacOS)).subscribe(() => {
  app.quit();
});
