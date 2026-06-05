import type { Profile } from "#main/features/profile";
import type { AppCradle } from "#main/features/types";
import { browserWindowCreated$ } from "#main/infra/app-rxjs";
import { is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import type { Observable, Subscription } from "rxjs";
import {
  BehaviorSubject,
  concat,
  concatMap,
  distinctUntilChanged,
  filter,
  fromEventPattern,
  ignoreElements,
  map,
  take,
  tap,
} from "rxjs";

const createWindowRx = (win: BrowserWindow) => {
  const readyToShow$ = fromEventPattern(
    (handler) => win.on("ready-to-show", handler),
    (handler) => win.off("ready-to-show", handler),
  );

  const didFinishLoad$ = fromEventPattern(
    (handler) => win.webContents.on("did-finish-load", handler),
    (handler) => win.webContents.off("did-finish-load", handler),
  );

  const closed$ = fromEventPattern(
    (handler) => win.on("closed", handler),
    (handler) => win.off("closed", handler),
  );

  return {
    readyToShow$,
    didFinishLoad$,
    closed$,
  };
};

export class AppWindow {
  private window$ = new BehaviorSubject<BrowserWindow | null>(null);
  private profile: Profile;
  private subscriptions: Subscription[];
  private createWindow$: Observable<BrowserWindow | null>;

  constructor({ profile }: AppCradle) {
    this.profile = profile;
    this.createWindow$ = browserWindowCreated$.pipe(
      map(([, win]) => win),
      tap((win) => {
        optimizer.watchWindowShortcuts(win);
        win.menuBarVisible = false;
        win.webContents.setWindowOpenHandler((details) => {
          shell.openExternal(details.url);
          return { action: "deny" };
        });
      }),
      concatMap((win) => {
        const winRxs = createWindowRx(win);

        return concat(
          winRxs.readyToShow$.pipe(
            take(1),
            tap(() => win.show()),
            ignoreElements(),
          ),
          winRxs.didFinishLoad$.pipe(
            take(1),
            map(() => win),
          ),
          winRxs.closed$.pipe(
            take(1),
            map(() => null),
          ),
        );
      }),
      distinctUntilChanged(),
    );

    const modeChanged$ = this.profile.state$.pipe(
      distinctUntilChanged((previous, current) => {
        return previous.alwaysOnTop === current.alwaysOnTop;
      }),
    );
    const subscription1 = modeChanged$.subscribe((state) => {
      this.current?.setAlwaysOnTop(state.alwaysOnTop);
    });
    const subscription2 = this.createWindow$.subscribe(this.window$);
    this.subscriptions = [subscription1, subscription2];
  }

  dispose() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  get current() {
    return this.window$.value;
  }

  createWindow(url: string = "") {
    const alwaysOnTop = this.profile.state.alwaysOnTop;

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

    if (!is.dev) {
      const PRODUCTION_RENDERER_PATH = path.join(
        __dirname,
        "../renderer/index.html",
      );

      win.loadFile(PRODUCTION_RENDERER_PATH, {
        hash: URL.canParse(url) ? new URL(url).pathname : void 0,
      });

      return;
    }

    const ELECTRON_RENDERER_URL = process.env["ELECTRON_RENDERER_URL"]!;

    if (!URL.canParse(ELECTRON_RENDERER_URL)) {
      app.quit();
      return;
    }

    if (!URL.canParse(url)) {
      win.loadURL(ELECTRON_RENDERER_URL);
      return;
    }

    const devURL = new URL(ELECTRON_RENDERER_URL);
    devURL.hash = new URL(url).pathname;
    win.loadURL(devURL.href);
  }

  focusWindow(win: BrowserWindow) {
    if (win.isDestroyed()) {
      return;
    }

    if (win.isMinimized()) {
      win.restore();
    }

    win.focus();
  }

  show(url?: string) {
    const win = this.current;

    if (win) {
      win.webContents.send("open-url", { url });
      this.focusWindow(win);
      return;
    }

    this.createWindow(url);

    this.createWindow$
      .pipe(
        filter((win) => win instanceof BrowserWindow),
        filter((win) => !win.isDestroyed()),
        take(1),
      )
      .subscribe((win) => {
        this.focusWindow(win);
      });
  }
}
