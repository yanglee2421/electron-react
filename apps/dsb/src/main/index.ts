import { is, optimizer, platform } from "@electron-toolkit/utils";
import { asValue } from "awilix";
import { app, BrowserWindow } from "electron";
import path from "node:path";
import url from "node:url";
import {
  catchError,
  concat,
  EMPTY,
  filter,
  from,
  fromEventPattern,
  merge,
  mergeMap,
  Observable,
  of,
  partition,
  switchMap,
  take,
  takeUntil,
  tap,
} from "rxjs";
import { container } from "./ioc";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CreateWindowOptions {
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
    },

    show: false,
    alwaysOnTop,
  });
  win.menuBarVisible = false;
  win.setMenu(null);

  const beforeInputEvent$ = fromEventPattern<[Electron.Event, Electron.Input]>(
    (f) => win.webContents.on("before-input-event", f),
    (f) => win.webContents.off("before-input-event", f),
  );
  const webContentsDestroyed$ = fromEventPattern(
    (f) => win.webContents.on("destroyed", f),
    (f) => win.webContents.off("destroyed", f),
  );

  beforeInputEvent$
    .pipe(
      filter(([, input]) => {
        return input.type === "keyDown" && input.control && input.key === "f";
      }),
      tap(() => {
        win.setFullScreen(!win.isFullScreen());
      }),
      takeUntil(webContentsDestroyed$),
    )
    .subscribe();

  if (is.dev) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL!);
  } else {
    const RENDERER_FILE = path.resolve(__dirname, "../renderer/index.html");
    win.loadFile(RENDERER_FILE);
  }
};

const lock$ = of(app.requestSingleInstanceLock());
const [lockSuccess$, lockFailed$] = partition(lock$, (locked) => locked);
const whenReady$ = from(app.whenReady());
const willQuit$ = fromEventPattern(
  (f) => app.on("will-quit", f),
  (f) => app.off("will-quit", f),
);
const browserWindowCreated$ = fromEventPattern<[Electron.Event, BrowserWindow]>(
  (f) => app.on("browser-window-created", f),
  (f) => app.off("browser-window-created", f),
).pipe(
  mergeMap(([, win]) => {
    return fromEventPattern(
      (f) => win.on("ready-to-show", f),
      (f) => win.off("ready-to-show", f),
    ).pipe(
      take(1),
      tap(() => {
        optimizer.watchWindowShortcuts(win);
        win.show();
      }),
    );
  }),
);
const windowAllClosed$ = fromEventPattern(
  (f) => app.on("window-all-closed", f),
  (f) => app.off("window-all-closed", f),
).pipe(
  filter(() => !platform.isMacOS),
  tap(() => app.quit()),
);
const secondInstance$ = fromEventPattern(
  (f) => app.on("second-instance", f),
  (f) => app.off("second-instance", f),
).pipe(tap(() => createWindow()));
const ioc$ = new Observable((sub) => {
  const DB_PATH = path.resolve(app.getPath("userData"), "./db.db");
  container.register({ DB_PATH: asValue(DB_PATH) });

  const { appProfile } = container.cradle;
  sub.next({ appProfile });

  return () => {
    container.dispose();
  };
}).pipe(tap(() => createWindow()));

lockFailed$.subscribe(() => {
  console.warn(
    "Another instance of the app is already running. This instance will be closed.",
  );
  app.quit();
});

lockSuccess$
  .pipe(
    tap(() => {
      if (is.dev) {
        const USER_DATA_PATH_DEV = path.resolve(
          app.getPath("appData"),
          `./${app.getName()}-dev`,
        );
        app.setPath("userData", USER_DATA_PATH_DEV);
      }

      if (is.dev) {
        app.setAsDefaultProtocolClient("app-dsb", process.execPath, [
          path.resolve(process.argv[1]),
        ]);
      } else {
        app.setAsDefaultProtocolClient("app-dsb");
      }
    }),
    switchMap(() => {
      return merge(
        secondInstance$,
        browserWindowCreated$,
        windowAllClosed$,
        concat(whenReady$, ioc$),
      );
    }),
    catchError((error) => {
      console.error(error);

      return EMPTY;
    }),
    takeUntil(willQuit$),
  )
  .subscribe();
