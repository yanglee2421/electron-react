import { electronApp, is, optimizer, platform } from "@electron-toolkit/utils";
import { asValue } from "awilix";
import {
  app,
  BrowserWindow,
  Menu,
  nativeTheme,
  net,
  protocol,
  shell,
} from "electron";
import fs from "node:fs";
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
  retry,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
  timer,
  using,
} from "rxjs";
import { container } from "./features";
import * as cmdIPC from "./features/cmd/ipc";
import * as dbIPC from "./features/db/ipc";
import * as guangzhoubeiIPC from "./features/guangzhoubei/ipc";
import * as guangzhoujibaoduanIPC from "./features/guangzhoujibaoduan/ipc";
import * as hxzyIPC from "./features/hxzy/ipc";
import * as imageIPC from "./features/image/ipc";
import * as jtvIPC from "./features/jtv/ipc";
import * as khIPC from "./features/kh_hmis/ipc";
import * as kvIPC from "./features/kv/ipc";
import * as logIPC from "./features/logger/ipc";
import * as mdbIPC from "./features/mdb/ipc";
import * as plcIPC from "./features/plc/ipc";
import * as printerIPC from "./features/printer/ipc";
import * as profileIPC from "./features/profile/ipc";
import * as xmlIPC from "./features/xml/ipc";
import * as infraIPC from "./infra/ipc";

/**
 * Avoid single instance in development version & production version
 */
if (is.dev) {
  const devUserDataPath = path.resolve(
    app.getPath("appData"),
    `./${app.getName()}-dev`,
  );
  app.setPath("userData", devUserDataPath);
}

/**
 * Disable GPU & Sandbox to avoid crash
 */
if (platform.isLinux) {
  app.disableHardwareAcceleration();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "ziyun",
    privileges: {
      // 标记为安全协议（和 https 一样，不会触发混淆内容警告）
      secure: true,
      // 标准协议
      standard: true,
      // 允许通过 fetch/img 标签加载
      supportFetchAPI: true,
      // 允许跨域
      corsEnabled: true,
      stream: true,
    },
  },
]);

const createWindow = () => {
  const { profile } = container.cradle;
  const alwaysOnTop = profile.state.alwaysOnTop;

  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      plugins: false,
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

  return is.dev
    ? win.loadURL(process.env["ELECTRON_RENDERER_URL"]!)
    : win.loadFile(path.join(__dirname, "../renderer/index.html"));
};

// Define rxjs observable
const singleInstanceLock$ = defer(() => of(app.requestSingleInstanceLock()));
const [primaryInstance$, duplicateInstance$] = partition(
  singleInstanceLock$.pipe(shareReplay(1)),
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
const secondInstance$ = fromEventPattern<[Electron.Event, string[]]>(
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
      guangzhoubei,
      guangzhoujibaoduan,
      hxzy,
      image,
      jtv,
      kh,
      kv,
      logger,
      mdb,
      plc,
      printer,
      profile,
    } = container.cradle;
    const infraUnIPC = infraIPC.registerIPCHandlers();

    const cmdUnIPC = cmdIPC.registerIPCHandlers(cmd);
    const dbUnIPC = dbIPC.registerIPCHandlers(db);
    const guangzhoubeiUnIPC = guangzhoubeiIPC.registerIPCHandlers(guangzhoubei);
    const guangzhoujibaoduanUnIPC =
      guangzhoujibaoduanIPC.registerIPCHandlers(guangzhoujibaoduan);
    const hxzyUnIPC = hxzyIPC.registerIPCHandlers(hxzy);
    const imageUnIPC = imageIPC.registerIPCHandlers(image);
    const jtvUnIPC = jtvIPC.registerIPCHandlers(jtv);
    const khUnIPC = khIPC.registerIPCHandlers(kh);
    const kvUnIPC = kvIPC.registerIPCHandlers(kv);
    const logUnIPC = logIPC.registerIPCHandlers(logger);
    const mdbUnIPC = mdbIPC.registerIPCHandlers(mdb);
    const plcUnIPC = plcIPC.registerIPCHandlers(plc);
    const printerUnIPC = printerIPC.registerIPCHandlers(printer);
    const profileUnIPC = profileIPC.registerIPCHandlers(profile);
    const xmlUnIPC = xmlIPC.registerIPCHandlers();

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

    if (is.dev) {
      app.setAsDefaultProtocolClient("app-ziyun", process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    } else {
      app.setAsDefaultProtocolClient("app-ziyun");
    }

    protocol.handle("ziyun", (request) => {
      const filePath = new URL(request.url).searchParams.get("file")!;

      return net.fetch(url.pathToFileURL(filePath).href);
    });

    return {
      unsubscribe: () => {
        infraUnIPC();

        cmdUnIPC();
        dbUnIPC();
        guangzhoubeiUnIPC();
        guangzhoujibaoduanUnIPC();
        hxzyUnIPC();
        imageUnIPC();
        jtvUnIPC();
        khUnIPC();
        kvUnIPC();
        logUnIPC();
        mdbUnIPC();
        plcUnIPC();
        printerUnIPC();
        profileUnIPC();
        xmlUnIPC();

        container.dispose();
        profileSubscription.unsubscribe();
        loggerSubscription.unsubscribe();
        protocol.unhandle("ziyun");
      },
    };
  },
  // A value must be emitted to trigger the callback function passed to the subscriber,
  // Even if we don't actually need it
  () => NEVER.pipe(startWith(null)),
);

const retryDelay$ = defer(() => {
  return from(container.dispose()).pipe(
    tap(() => {
      const dbPath = path.resolve(app.getPath("userData"), "db.db");
      const desktopDbPath = path.resolve(app.getPath("desktop"), "db.db");

      fs.cpSync(dbPath, desktopDbPath, { recursive: true });
      fs.rmSync(dbPath, { recursive: true, force: true });
    }),
    switchMap(() => timer(200)),
  );
});

// Subscribe Observerable

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
    retry({
      count: 1,
      delay: () => retryDelay$,
    }),
  )
  .subscribe(() => {
    Menu.setApplicationMenu(null);

    if (platform.isWindows) {
      electronApp.setAppUserModelId("com.electron");
    }

    createWindow();
  });

willQuit$.pipe(take(1)).subscribe(() => {
  primarySubscription.unsubscribe();
});

activate$
  .pipe(filter(() => BrowserWindow.getAllWindows().length === 0))
  .subscribe(() => createWindow());

secondInstance$.subscribe(([, cmds]) => {
  if (is.dev) {
    const url = cmds.at(-1);
    console.log(url);
  }

  const win = BrowserWindow.getAllWindows().at(0);
  if (!win) return;

  win.webContents.send("secondInstance");

  if (win.isMinimized()) {
    win.restore();
  }

  win.focus();
});

browserWindowCreated$.subscribe((args) => {
  const [, win] = args;

  optimizer.watchWindowShortcuts(win);

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
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

windowAllClosed$
  .pipe(
    filter(() => !platform.isMacOS),
    take(1),
  )
  .subscribe(() => {
    app.quit();
  });
