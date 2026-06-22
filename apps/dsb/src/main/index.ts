import { app, BrowserWindow } from "electron";
import { platform } from "node:os";
import path from "node:path";
import {
  BehaviorSubject,
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
  startWith,
  take,
  takeUntil,
  tap,
  using,
} from "rxjs";

const window$ = new BehaviorSubject<null | BrowserWindow>(null);
const mainWindow$ = defer(() => {
  // Create Browser Window and load page
  const win = new BrowserWindow({
    show: false,
  });
  win.menuBarVisible = false;

  if (app.isPackaged) {
    win.loadFile(path.resolve(__dirname, "../renderer/index.html"));
  } else {
    win.loadURL(process.env.DS_RENDERER_URL!);
  }

  //
  const closed$ = fromEventPattern(
    (f) => win.on("closed", f),
    (f) => win.off("closed", f),
  );

  return NEVER.pipe(startWith(win), takeUntil(closed$));
});

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
);

duplicate$.subscribe(() => {
  app.quit();
});

concat(
  primary$.pipe(ignoreElements()),
  whenReady$.pipe(ignoreElements()),
  resource$,
).subscribe(() => {
  // win.webContents.on("did-finish-load", () => {
  // win.webContents.openDevTools();
  // });

  mainWindow$.subscribe(window$);
});

browserWindowCreated$
  .pipe(
    map(([, win]) => win),
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
    filter(() => platform() !== "darwin"),
    tap(() => app.quit()),
  )
  .subscribe();
