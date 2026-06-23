import { optimizer, platform } from "@electron-toolkit/utils";
import { app, BrowserWindow } from "electron";
import path from "node:path";
import {
  concat,
  defer,
  filter,
  from,
  fromEventPattern,
  ignoreElements,
  map,
  mergeMap,
  NEVER,
  of,
  partition,
  shareReplay,
  startWith,
  take,
  takeUntil,
  tap,
  using,
} from "rxjs";

interface CreateWindowOptions {
  additionalArguments?: string[];
  alwaysOnTop?: boolean;
}

const createWindow = ({
  additionalArguments,
  alwaysOnTop,
}: CreateWindowOptions = {}) => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
      additionalArguments,
    },
    alwaysOnTop,
  });
  win.menuBarVisible = false;

  if (app.isPackaged) {
    win.loadFile(path.resolve(__dirname, "../renderer/index.html"));
  } else {
    win.loadURL(process.env.DS_RENDERER_URL!);
  }

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
const [primary$, duplicate$] = partition(
  defer(() => of(app.requestSingleInstanceLock())),
  (i) => i,
);
const secondInstance$ = fromEventPattern(
  (f) => app.on("second-instance", f),
  (f) => app.off("second-instance", f),
);

const resource$ = using(
  () => {
    console.log("subscribe");

    return {
      unsubscribe: () => {
        console.log("unsubscribe");
      },
    };
  },
  () => NEVER.pipe(startWith(null), takeUntil(willQuit$)),
).pipe(shareReplay({ bufferSize: 1, refCount: true }));

duplicate$.subscribe(() => {
  app.quit();
});

concat(
  primary$.pipe(ignoreElements()),
  whenReady$.pipe(ignoreElements()),
  resource$,
).subscribe(() => {
  createWindow();
});

secondInstance$.subscribe(() => {
  createWindow();
});

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
    tap((win) => {
      optimizer.watchWindowShortcuts(win);
    }),
  )
  .subscribe();
