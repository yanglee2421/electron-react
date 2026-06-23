import type { Profile } from "#main/features/profile";
import type { AppCradle } from "#main/features/types";
import { app, BrowserWindow } from "electron";
import path from "node:path";
import type { Subscription } from "rxjs";
import { distinctUntilChanged } from "rxjs";

export class AppWindow {
  private profile: Profile;
  private subscriptions: Subscription[];

  constructor({ profile }: AppCradle) {
    this.profile = profile;

    const modeChanged$ = this.profile.state$.pipe(
      distinctUntilChanged((previous, current) => {
        return previous.alwaysOnTop === current.alwaysOnTop;
      }),
    );

    this.subscriptions = [
      modeChanged$.subscribe((state) => {
        BrowserWindow.getAllWindows().forEach((win) => {
          win.setAlwaysOnTop(state.alwaysOnTop);
        });
      }),
    ];
  }

  dispose() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
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

    if (app.isPackaged) {
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
    const win = BrowserWindow.getAllWindows().at(0);

    if (win) {
      win.webContents.send("open-url", { url });
      this.focusWindow(win);
      return;
    }

    this.createWindow(url);
  }
}
