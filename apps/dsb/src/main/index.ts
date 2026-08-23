import wkPath from "#main/mdb.worker?worker&url";
import { is, optimizer, platform } from "@electron-toolkit/utils";
import { asValue } from "awilix";
import { app, BrowserWindow } from "electron";
import path from "node:path";
import url from "node:url";
import {
  catchError,
  concat,
  defer,
  EMPTY,
  filter,
  finalize,
  from,
  fromEventPattern,
  ignoreElements,
  map,
  mergeMap,
  Observable,
  of,
  take,
  takeUntil,
  tap,
} from "rxjs";
import { container } from "./ioc";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CreateWindowOptions {
  additionalArguments?: string[];
  alwaysOnTop?: boolean;
}

const createWindow = ({ alwaysOnTop }: CreateWindowOptions = {}) => {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.resolve(__dirname, "../preload/index.cjs"),

      sandbox: true,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,

      plugins: false,
    },

    show: false,
    alwaysOnTop,
  });
  win.menuBarVisible = false;

  if (!is.dev) {
    const RENDERER_FILE = path.resolve(__dirname, "../renderer/index.html");
    win.loadFile(RENDERER_FILE);
  }

  win.loadURL("http://localhost:5173");
};

const whenReady$ = from(app.whenReady());
const willQuit$ = fromEventPattern(
  (f) => app.on("will-quit", f),
  (f) => app.off("will-quit", f),
);
const browserWindowCreated$ = fromEventPattern<[Electron.Event, BrowserWindow]>(
  (f) => app.on("browser-window-created", f),
  (f) => app.off("browser-window-created", f),
);
const windowAllClosed$ = fromEventPattern(
  (f) => app.on("window-all-closed", f),
  (f) => app.off("window-all-closed", f),
);
const secondInstance$ = fromEventPattern(
  (f) => app.on("second-instance", f),
  (f) => app.off("second-instance", f),
);

const resource$ = new Observable((sub) => {
  const DB_PATH = path.resolve(app.getPath("userData"), "./db.db");
  container.register({ DB_PATH: asValue(DB_PATH) });

  const { appDb } = container.cradle;

  sub.next(appDb);

  return () => {
    container.dispose();
  };
}).pipe(
  catchError((error) => {
    console.error(error);

    return EMPTY;
  }),
);

const app$ = defer(() => {
  const hasLocked = app.requestSingleInstanceLock();

  if (!hasLocked) {
    return of(null).pipe(
      tap(() => {
        console.warn(
          "Another instance of the app is already running. This instance will be closed.",
        );
      }),
    );
  }

  return concat(whenReady$.pipe(ignoreElements()), resource$).pipe(
    tap(() => createWindow()),
    catchError((error) => {
      console.error(error);

      return EMPTY;
    }),
  );
}).pipe(
  takeUntil(willQuit$),
  finalize(() => app.quit()),
);

app$.subscribe();

secondInstance$.pipe(tap(() => createWindow())).subscribe();

browserWindowCreated$
  .pipe(
    map(([, win]) => win),
    tap((win) => optimizer.watchWindowShortcuts(win)),
    mergeMap((win) => {
      return fromEventPattern(
        (f) => win.on("ready-to-show", f),
        (f) => win.off("ready-to-show", f),
      ).pipe(
        take(1),
        tap(() => win.show()),
        tap(() => win.webContents.openDevTools()),
      );
    }),
  )
  .subscribe();

windowAllClosed$
  .pipe(
    filter(() => !platform.isMacOS),
    tap(() => app.quit()),
  )
  .subscribe();

console.log("wkPath:", wkPath);
