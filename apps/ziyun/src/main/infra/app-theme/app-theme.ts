import type { AppCradle } from "#main/features/types";
import { nativeTheme } from "electron";
import type { Subscription } from "rxjs";
import { distinctUntilChanged, tap } from "rxjs";

export class AppTheme {
  private subscription: Subscription;

  constructor({ profile }: AppCradle) {
    this.subscription = profile.state$
      .pipe(
        distinctUntilChanged(
          (previous, current) => previous.mode === current.mode,
        ),
        tap((state) => {
          nativeTheme.themeSource = state.mode;
        }),
      )
      .subscribe();
  }

  dispose() {
    this.subscription.unsubscribe();
  }
}
