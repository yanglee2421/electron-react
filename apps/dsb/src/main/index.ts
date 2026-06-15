import { app, BrowserWindow } from "electron";
import path from "node:path";
import {
  defer,
  from,
  fromEventPattern,
  map,
  of,
  partition,
  switchMap,
} from "rxjs";

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

duplicate$.subscribe(() => {
  app.quit();
});

primary$.pipe(switchMap(() => whenReady$)).subscribe(() => {
  const win = new BrowserWindow({});
  win.menuBarVisible = false;

  if (app.isPackaged) {
    win.loadFile(path.resolve(__dirname, "../renderer/index.html"));
  } else {
    win.loadURL(process.env.DS_RENDERER_URL!);
  }
});

browserWindowCreated$.pipe(map(([, win]) => win)).subscribe();
void {
  windowAllClosed$,
  willQuit$,
};
