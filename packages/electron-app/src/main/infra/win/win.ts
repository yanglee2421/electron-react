import type { Profile } from "#main/features/profile";
import type { AppCradle } from "#main/features/types";

import { BrowserWindow, nativeTheme } from "electron";
import path from "node:path";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  fromEventPattern,
  switchMap,
} from "rxjs";

export class Win {
  private win$ = new BehaviorSubject<BrowserWindow | null>(null);
  private profile: Profile;
  private subscriptions: Subscription[];

  constructor({ profile }: AppCradle) {
    this.profile = profile;

    const alwaysOnTop$ = this.profile.state$.pipe(
      distinctUntilChanged(
        (previous, current) => previous.alwaysOnTop === current.alwaysOnTop,
      ),
    );

    const mode$ = this.profile.state$.pipe(
      distinctUntilChanged(
        (previous, current) => previous.mode === current.mode,
      ),
    );

    const winEvent$ = this.win$.pipe(
      filter((win): win is BrowserWindow => win !== null),
      switchMap((win) => {
        return fromEventPattern(
          (handler) => win.on("close", handler),
          (handler) => win.off("close", handler),
        );
      }),
    );

    this.subscriptions = [
      alwaysOnTop$.subscribe((state) => {
        const win = this.win$.value;
        win?.setAlwaysOnTop(state.alwaysOnTop);
      }),
      mode$.subscribe((state) => {
        nativeTheme.themeSource = state.mode;
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
}
