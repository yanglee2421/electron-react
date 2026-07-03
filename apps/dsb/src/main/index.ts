import { is, optimizer, platform } from "@electron-toolkit/utils";
import { asValue } from "awilix";
import { app, BrowserWindow } from "electron";
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
  from,
  fromEventPattern,
  ignoreElements,
  map,
  mergeMap,
  NEVER,
  of,
  shareReplay,
  startWith,
  take,
  takeUntil,
  tap,
  using,
} from "rxjs";
import { container } from "./ioc";

if (is.dev) {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const packageJson = fs.readFileSync(
    path.resolve(__dirname, "../../package.json"),
    "utf-8",
  );

  try {
    const name = JSON.parse(packageJson).name || app.getName();
    app.setName(name);
  } catch (error) {
    console.error(error);
  }

  const USER_DATA_PATH_DEV = path.resolve(
    app.getPath("appData"),
    `./${app.getName()}-dev`,
  );
  app.setPath("userData", USER_DATA_PATH_DEV);
}

interface CreateWindowOptions {
  additionalArguments?: string[];
  alwaysOnTop?: boolean;
  customURL?: string;
}

const createWindow = ({
  additionalArguments,
  alwaysOnTop,
  customURL = "",
}: CreateWindowOptions = {}) => {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.resolve(__dirname, "../preload/index.cjs"),

      sandbox: true,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,

      plugins: false,
      additionalArguments,
    },

    show: false,
    alwaysOnTop,
  });
  win.menuBarVisible = false;

  if (!is.dev) {
    const RENDERER_FILE = path.resolve(__dirname, "../renderer/index.html");
    win.loadFile(RENDERER_FILE, {
      hash: URL.canParse(customURL) ? new URL(customURL).pathname : void 0,
    });
    return win;
  }

  const RENDERER_URL = process.env.DS_RENDERER_URL!;

  if (!URL.canParse(RENDERER_URL)) {
    console.warn(`process.env.DS_RENDERER_URL can not parse to URL !`);
    app.quit();
    return win;
  }

  if (!URL.canParse(customURL)) {
    win.loadURL(RENDERER_URL);
    return win;
  }

  const CUSTOM_RENDERER_URL = new URL(RENDERER_URL);
  CUSTOM_RENDERER_URL.hash = new URL(customURL).pathname;
  win.loadURL(CUSTOM_RENDERER_URL.href);

  return win;
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

const resource$ = using(
  () => {
    const DB_PATH = path.resolve(app.getPath("userData"), "./db.db");
    container.register({ DB_PATH: asValue(DB_PATH) });

    const { appDb } = container.cradle;

    return {
      unsubscribe: () => {
        container.dispose();
      },
      appDb,
    };
  },
  () => NEVER.pipe(startWith(null), takeUntil(willQuit$)),
).pipe(shareReplay({ bufferSize: 1, refCount: true }));

const app$ = defer(() => {
  const hasLocked = app.requestSingleInstanceLock();

  if (!hasLocked) {
    return of(null).pipe(
      tap(() => {
        console.warn(
          "Another instance of the app is already running. This instance will be closed.",
        );
        app.quit();
      }),
    );
  }

  return concat(whenReady$.pipe(ignoreElements()), resource$).pipe(
    tap(() => createWindow()),
    catchError((error) => {
      console.error(error);

      return EMPTY;
    }),
    finalize(() => {
      app.quit();
    }),
  );
});

app$.subscribe();

secondInstance$.pipe(tap(() => createWindow())).subscribe();

browserWindowCreated$
  .pipe(
    map(([, win]) => win),
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

windowAllClosed$
  .pipe(
    filter(() => !platform.isMacOS),
    tap(() => app.quit()),
  )
  .subscribe();

browserWindowCreated$
  .pipe(
    map(([, win]) => win),
    filter((win) => !win.isDestroyed()),
    tap((win) => optimizer.watchWindowShortcuts(win)),
  )
  .subscribe();
