import { hydrateSubject } from "#main/utils/hydrate-subject";
import { PROFILE_STORAGE_KEY } from "#shared/instances/constants";
import type { Profile as AppProfile } from "#shared/instances/schema";
import { profile } from "#shared/instances/schema";
import { BrowserWindow, globalShortcut } from "electron";
import type { BehaviorSubject, Subscription } from "rxjs";
import { distinctUntilChanged, EMPTY, Observable, switchMap } from "rxjs";
import type { AppCradle } from "../types";

export class Profile {
  private state$: BehaviorSubject<AppProfile>;
  private subscriptions: Subscription[];

  constructor({ kv }: AppCradle) {
    const [state$, sub] = hydrateSubject(kv, PROFILE_STORAGE_KEY, profile);
    this.state$ = state$;

    const sub2 = this.state$
      .pipe(
        distinctUntilChanged((p, c) => p.alwaysOnTop === c.alwaysOnTop),
        switchMap((s) => {
          if (!s.alwaysOnTop) {
            return EMPTY;
          }

          return new Observable((sub) => {
            globalShortcut.register("Alt+Space", () => {
              BrowserWindow.getAllWindows().forEach((win) => {
                if (win.isDestroyed()) {
                  return;
                }

                if (win.isMinimized()) {
                  win.restore();
                }

                win.focus();
              });
            });

            sub.next(null);

            return () => {
              globalShortcut.unregisterAll();
            };
          });
        }),
      )
      .subscribe();

    this.subscriptions = [sub, sub2];
  }
  dispose() {
    this.state$.complete();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  when() {
    return this.state$.asObservable();
  }
  get state(): AppProfile {
    return this.state$.getValue();
  }
}
