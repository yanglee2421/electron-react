import { container } from "#main/ioc";
import { hydrateSubject } from "#main/utils/hydrate-subject";
import { APP_PROFILE_STORAGE_KEY } from "#shared/constants/app-profile";
import type { AppProfileType } from "#shared/functions/app-profile";
import { createAppProfileSchema } from "#shared/functions/app-profile";
import type { BehaviorSubject, Subscription } from "rxjs";
import { distinctUntilChanged, EMPTY, Observable, switchMap } from "rxjs";
import type { AppCradle } from "../types";

const cmd$ = new Observable((sub) => {
  const scope = container.createScope();
  const { cmd } = scope.cradle;

  sub.next(cmd);

  return () => {
    scope.dispose();
  };
});

export class AppProfile {
  private state$: BehaviorSubject<AppProfileType>;
  private subscriptions: Subscription[];

  constructor({ kv }: AppCradle) {
    const schema = createAppProfileSchema();
    const [state$, subscription] = hydrateSubject(
      kv,
      APP_PROFILE_STORAGE_KEY,
      schema,
    );
    const cmdSubscription = state$
      .pipe(
        distinctUntilChanged((p, c) => p.enableCmd === c.enableCmd),
        switchMap((state) => {
          if (!state.enableCmd) {
            return EMPTY;
          }

          return cmd$;
        }),
      )
      .subscribe();

    this.state$ = state$;
    this.subscriptions = [subscription, cmdSubscription];
  }

  dispose() {
    this.state$.complete();
    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    });
  }

  when() {
    return this.state$.asObservable();
  }
  state() {
    return this.state$.getValue();
  }
}
