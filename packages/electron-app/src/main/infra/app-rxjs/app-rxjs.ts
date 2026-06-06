import type { BrowserWindow } from "electron";
import { app } from "electron";
import { from, fromEventPattern, of, partition } from "rxjs";

export const whenReady$ = from(app.whenReady());
export const willQuit$ = fromEventPattern(
  (handler) => app.on("will-quit", handler),
  (handler) => app.off("will-quit", handler),
);
export const activate$ = fromEventPattern(
  (handler) => app.on("activate", handler),
  (handler) => app.off("activate", handler),
);
export const browserWindowCreated$ = fromEventPattern<
  [Electron.Event, BrowserWindow]
>(
  (handler) => app.on("browser-window-created", handler),
  (handler) => app.off("browser-window-created", handler),
);
export const windowAllClosed$ = fromEventPattern(
  (handler) => app.on("window-all-closed", handler),
  (handler) => app.off("window-all-closed", handler),
);
export const secondInstance$ = fromEventPattern<[Electron.Event, string[]]>(
  (handler) => app.on("second-instance", handler),
  (handler) => app.off("second-instance", handler),
);
export const [primaryInstance$, duplicateInstance$] = partition(
  of(app.requestSingleInstanceLock()),
  (hasLock) => hasLock,
);
