import type { Profile } from "#main/features/profile";
import type { AppCradle } from "#main/features/types";
import { BrowserWindow, app } from "electron";
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

  createWindow(customURL: string = "") {
    const alwaysOnTop = this.profile.state.alwaysOnTop;

    const win = new BrowserWindow({
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.cjs"),

        sandbox: true,
        webSecurity: true,
        nodeIntegration: false,
        contextIsolation: true,

        // plugins: false,
        // additionalArguments: [],
      },

      show: false,
      alwaysOnTop,
      autoHideMenuBar: false,

      width: 1024,
      height: 768,
      minWidth: 380,
    });

    if (app.isPackaged) {
      const RENDERER_FILE = path.resolve(__dirname, "../renderer/index.html");
      win.loadFile(RENDERER_FILE, {
        hash: URL.canParse(customURL) ? new URL(customURL).pathname : void 0,
      });
      return;
    }

    const RENDERER_URL = process.env["ELECTRON_RENDERER_URL"]!;

    if (!URL.canParse(RENDERER_URL)) {
      app.quit();
      return;
    }

    const renderURL = new URL(RENDERER_URL);

    if (URL.canParse(customURL)) {
      renderURL.hash = new URL(customURL).pathname;
    }

    win.loadURL(renderURL.href);
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
