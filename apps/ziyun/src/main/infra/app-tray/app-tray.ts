import type { AppCradle } from "#main/features/types";
import { app, Menu, nativeImage, Tray } from "electron";
import path from "node:path";
import type { Subscription } from "rxjs";
import {
  distinctUntilChanged,
  fromEventPattern,
  Observable,
  of,
  switchMap,
} from "rxjs";

export class AppTray {
  private subscription: Subscription;

  constructor({ profile, appWindow }: AppCradle) {
    this.subscription = profile.state$
      .pipe(
        distinctUntilChanged(
          (previous, current) => previous.trayEnabled === current.trayEnabled,
        ),
        switchMap((state) => {
          if (!state.trayEnabled) {
            return of(null);
          }

          return new Observable<Tray>((sub) => {
            const iconPath = path.join(app.getAppPath(), "resources/icon.png");
            const tray = new Tray(nativeImage.createFromPath(iconPath));
            const contextMenu = Menu.buildFromTemplate([
              {
                label: "显示主界面",
                click: () => {
                  appWindow.show();
                },
              },
              {
                label: "功能设置",
                click: () => {
                  console.log("click setting");
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
              appWindow.show();
            });

            sub.next(tray);

            return () => {
              subscription.unsubscribe();
              tray.destroy();
            };
          });
        }),
      )
      .subscribe();
  }

  dispose() {
    this.subscription.unsubscribe();
  }
}
