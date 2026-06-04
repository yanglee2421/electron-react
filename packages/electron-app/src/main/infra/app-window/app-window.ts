import type { Profile } from "#main/features/profile";
import type { AppCradle } from "#main/features/types";
import { app, BrowserWindow } from "electron";
import path from "node:path";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  concatMap,
  concatWith,
  distinctUntilChanged,
  fromEventPattern,
  map,
  take,
} from "rxjs";

export class AppWindow {
  private win$ = new BehaviorSubject<BrowserWindow | null>(null);
  private profile: Profile;
  private subscriptions: Subscription[];

  constructor({ profile }: AppCradle) {
    this.profile = profile;

    const subscription1 = this.profile.state$
      .pipe(
        distinctUntilChanged(
          (previous, current) => previous.alwaysOnTop === current.alwaysOnTop,
        ),
      )
      .subscribe((state) => {
        const win = this.current;
        win?.setAlwaysOnTop(state.alwaysOnTop);
      });

    const browerWindowCreated$ = fromEventPattern<
      [Electron.Event, BrowserWindow]
    >(
      (handler) => app.on("browser-window-created", handler),
      (handler) => app.off("browser-window-created", handler),
    );

    const subscription2 = browerWindowCreated$
      .pipe(
        concatMap(([, win]) => {
          return fromEventPattern(
            (handler) => win.webContents.on("did-finish-load", handler),
            (handler) => win.webContents.off("did-finish-load", handler),
          ).pipe(
            take(1),
            map(() => win),
            concatWith(
              fromEventPattern(
                (handler) => win.on("closed", handler),
                (handler) => win.off("closed", handler),
              ).pipe(
                take(1),
                map(() => null),
              ),
            ),
          );
        }),
      )
      .subscribe(this.win$);

    this.subscriptions = [subscription1, subscription2];
  }

  dispose() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.win$.complete();
  }

  get current() {
    return this.win$.value;
  }

  ensureWindow() {
    const currentWindow = this.current;

    if (currentWindow instanceof BrowserWindow) {
      return currentWindow;
    }

    const alwaysOnTop = this.profile.state.alwaysOnTop;

    return new BrowserWindow({
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
  }

  show() {
    const win = this.ensureWindow();

    if (win.isMaximized()) {
      win.restore();
    }

    win.focus();
  }
}
