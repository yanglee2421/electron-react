import {
  browserWindowCreated$,
  secondInstance$,
  whenReady$,
  willQuit$,
  windowAllClosed$,
} from "#main/infra/app-rxjs";
import { electronApp, is, optimizer, platform } from "@electron-toolkit/utils";
import { asValue } from "awilix";
import dayjs from "dayjs";
import { app, Menu } from "electron";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import {
  catchError,
  concat,
  defer,
  EMPTY,
  filter,
  finalize,
  fromEventPattern,
  ignoreElements,
  map,
  mergeMap,
  Observable,
  of,
  shareReplay,
  take,
  takeUntil,
  tap,
} from "rxjs";
import { container } from "./features";
import * as cmdIPC from "./features/cmd/ipc";
import * as dbIPC from "./features/db/ipc";
import * as guangzhoubeiIPC from "./features/guangzhoubei/ipc";
import * as guangzhoucheliangIPC from "./features/guangzhoucheliang/ipc";
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
import * as qtIPC from "./features/qt/ipc";
import * as xmlIPC from "./features/xml/ipc";
import * as infraIPC from "./infra/ipc";

/**
 * Avoid single instance in development version & production version
 */
if (is.dev) {
  const USER_DATA_PATH_DEV = path.resolve(
    app.getPath("appData"),
    `./${app.getName()}-dev`,
  );
  app.setPath("userData", USER_DATA_PATH_DEV);
}

if (is.dev) {
  app.setAsDefaultProtocolClient("app-ziyun", process.execPath, [
    path.resolve(process.argv[1]),
  ]);
} else {
  app.setAsDefaultProtocolClient("app-ziyun");
}

/**
 * Disable GPU & Sandbox to avoid crash
 */
if (platform.isLinux) {
  app.disableHardwareAcceleration();
}

const APP_DB_PATH = path.resolve(app.getPath("userData"), "db.db");

const resource$ = new Observable((sub) => {
  container.register({ dbPath: asValue(APP_DB_PATH) });

  const { db } = container.cradle;
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(__dirname, "../../drizzle/db");
  db.migrate(migrationsFolder);

  const {
    cmd,
    qt,
    guangzhoubei,
    guangzhoucheliang,
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

    appProtocol,
    appTheme,
    appTray,
    appWindow,
  } = container.cradle;
  const infraUnIPC = infraIPC.registerIPCHandlers();

  const cmdUnIPC = cmdIPC.registerIPCHandlers(cmd);
  const dbUnIPC = dbIPC.registerIPCHandlers(db);
  const guangzhoubeiUnIPC = guangzhoubeiIPC.registerIPCHandlers(guangzhoubei);
  const guangzhoucheliangUnIPC = guangzhoucheliangIPC.ipc(guangzhoucheliang);
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
  const qtUnIPC = qtIPC.registerIPCHandlers(qt);
  const xmlUnIPC = xmlIPC.registerIPCHandlers();

  appProtocol.handle();
  void appTheme;
  void appTray;
  void appWindow;
  sub.next(container);

  return () => {
    container.dispose();

    infraUnIPC();

    cmdUnIPC();
    dbUnIPC();
    qtUnIPC();
    guangzhoubeiUnIPC();
    guangzhoucheliangUnIPC();
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
    xmlUnIPC();
  };
}).pipe(shareReplay({ bufferSize: 1, refCount: true }));

/**
 * Main App Subscription
 */
const app$ = defer(() => {
  const hasLock = app.requestSingleInstanceLock();

  // If this instance is the second instance, quit immediately
  if (!hasLock) {
    return of(null).pipe(
      tap(() => {
        console.warn(
          "Another instance of the app is already running. This instance will be closed.",
        );
      }),
    );
  }

  // If this instance is the first instance, proceed with startup
  return concat(whenReady$.pipe(ignoreElements()), resource$).pipe(
    tap(() => {
      Menu.setApplicationMenu(null);

      if (platform.isWindows) {
        electronApp.setAppUserModelId("com.electron");
      }

      const { appWindow } = container.cradle;
      const openURL = process.argv.find((arg) => {
        return arg.startsWith("app-ziyun://");
      });

      appWindow.show(openURL);
    }),
    catchError((error) => {
      if (import.meta.env.DEV) {
        console.error(error);
      }

      container.dispose().then(async () => {
        const BACKUP_DB_PATH = path.resolve(
          app.getPath("desktop"),
          `db-backup-${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.db`,
        );

        await fs.promises.cp(APP_DB_PATH, BACKUP_DB_PATH, { recursive: true });
        await fs.promises.rm(APP_DB_PATH, { recursive: true, force: true });
      });

      return EMPTY;
    }),
  );
}).pipe(
  takeUntil(willQuit$),
  finalize(() => app.quit()),
);

app$.subscribe();

secondInstance$
  .pipe(
    tap(([, argv]) => {
      const url = argv.find((arg) => arg.startsWith("app-ziyun://"));
      const { appWindow } = container.cradle;

      appWindow.show(url);
    }),
  )
  .subscribe();

windowAllClosed$
  .pipe(
    filter(() => !platform.isMacOS),
    filter(() => !container.cradle.profile.state.trayEnabled),
    tap(() => app.quit()),
  )
  .subscribe();

browserWindowCreated$
  .pipe(
    map(([, win]) => win),
    tap((win) => optimizer.watchWindowShortcuts(win)),
    tap((win) => {
      win.on("focus", () => {
        win.webContents.send("windowFocus");
      });
      win.on("blur", () => {
        win.webContents.send("windowBlur");
      });
    }),
    filter((win) => !win.isVisible()),
    mergeMap((win) => {
      return fromEventPattern(
        (f) => win.on("ready-to-show", f),
        (f) => win.off("ready-to-show", f),
      ).pipe(
        take(1),
        tap(() => win.show()),
      );
    }),
  )
  .subscribe();
