import iconPath from "#resources/icon.png?asset";
import { app, Menu, nativeImage, Tray } from "electron";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  distinctUntilChanged,
  fromEventPattern,
  last,
  NEVER,
  of,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  using,
} from "rxjs";
import type { AppCradle } from "../types";

export class AppTray {
  readonly tray$ = new BehaviorSubject<Tray | null>(null);
  private subscription: Subscription;

  constructor({ profile, win }: AppCradle) {
    this.subscription = profile.state$
      .pipe(
        distinctUntilChanged((a, b) => a.enableTray === b.enableTray),
        switchMap((state) => {
          if (!state.enableTray) {
            return of(null);
          }

          return using(
            () => {
              const tray = new Tray(nativeImage.createFromPath(iconPath));
              const contextMenu = Menu.buildFromTemplate([
                {
                  label: "显示主界面",
                  click: () => {
                    win.show();
                  },
                },
                {
                  label: "功能设置",
                  click: () => {
                    console.log("点击了设置");
                  },
                },
                { type: "separator" },
                {
                  label: "退出应用",
                  click: () => {
                    app.quit();
                  },
                },
              ]);

              tray.setContextMenu(contextMenu);

              const trayClick$ = fromEventPattern(
                (handler) => tray.on("click", handler),
                (handler) => tray.off("click", handler),
              );

              const subscription = trayClick$.subscribe(() => {
                win.show();
              });

              return {
                unsubscribe: () => {
                  subscription.unsubscribe();
                  tray.destroy();
                },
                tray,
              };
            },
            (c) => {
              const tray: Tray = Reflect.get(Object(c), "tray");

              return NEVER.pipe(startWith(tray));
            },
          );
        }),
        takeUntil(profile.state$.pipe(last())),
        shareReplay({ refCount: true, bufferSize: 1 }),
      )
      .subscribe(this.tray$);
  }

  dispose() {
    this.subscription.unsubscribe();
  }

  get tray() {
    return this.tray$.value;
  }
}
