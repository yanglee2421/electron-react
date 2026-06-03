import type { Profile } from "#main/features/profile";
import type { AppCradle } from "#main/features/types";
import { is } from "@electron-toolkit/utils";
import { BrowserWindow, nativeTheme } from "electron";
import path from "node:path";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  fromEventPattern,
  map,
  switchMap,
  tap,
} from "rxjs";

export class Win {
  private win$ = new BehaviorSubject<BrowserWindow | null>(null);
  private profile: Profile;
  private subscriptions: Subscription[];

  constructor({ profile, logger }: AppCradle) {
    this.profile = profile;

    const ui$ = this.profile.state$.pipe(
      distinctUntilChanged(
        (previous, current) =>
          previous.alwaysOnTop === current.alwaysOnTop &&
          previous.mode === current.mode,
      ),
    );

    const winEvent$ = this.win$.pipe(
      filter((win): win is BrowserWindow => win !== null),
      tap((win) => {
        win.menuBarVisible = false;
      }),
      tap((win) => {
        if (is.dev) {
          win.loadURL(process.env["ELECTRON_RENDERER_URL"]!);
        } else {
          win.loadFile(path.join(__dirname, "../renderer/index.html"));
        }
      }),
      switchMap((win) => {
        return fromEventPattern(
          (handler) => win.on("ready-to-show", handler),
          (handler) => win.off("ready-to-show", handler),
        ).pipe(map(() => win));
      }),
      tap((win) => {
        win.show();
      }),
      switchMap((win) => {
        return fromEventPattern(
          (handler) => win.on("close", handler),
          (handler) => win.off("close", handler),
        );
      }),
    );

    this.subscriptions = [
      ui$.subscribe((state) => {
        const win = this.win$.value;
        win?.setAlwaysOnTop(state.alwaysOnTop);
        nativeTheme.themeSource = state.mode;
      }),
      logger.event$.subscribe(() => {
        const win = this.win$.value;
        win?.webContents.send("logUpdated");
      }),
      winEvent$.subscribe(() => {
        this.win$.next(null);
      }),
    ];
  }

  dispose() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.win$.complete();
    this.win$.value?.destroy();
  }

  create() {
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

    this.win$.next(win);

    return win;
  }
  show() {
    const win = this.win$.value;

    if (win) {
      const _ = win.isMaximized() && win.restore();
      void _;
      win.focus();
    } else {
      this.create();
    }
  }
  send(channel: string, ...args: any[]) {
    this.win$.value?.webContents.send(channel, ...args);

    const win = this.win$.value;

    if (!win) return;
  }
}
