import { createServer } from "hmis-proxy";
import type { Subscription } from "rxjs";
import {
  distinctUntilChanged,
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

export class HmisProxy {
  private subscription: Subscription;
  constructor({ profile }: AppCradle) {
    this.subscription = profile.state$
      .pipe(
        distinctUntilChanged((previous, current) => {
          return (
            previous.enableHMISProxy === current.enableHMISProxy &&
            previous.hmisProxyPort === current.hmisProxyPort
          );
        }),
        switchMap((state) => {
          if (!state.enableHMISProxy) {
            return of(null);
          }

          return using(
            () => {
              const server = createServer(state.hmisProxyPort);

              return {
                unsubscribe: () => {
                  server.close();
                },
              };
            },
            () => NEVER.pipe(startWith(null)),
          );
        }),
        takeUntil(profile.state$.pipe(last())),
        shareReplay(1),
      )
      .subscribe();
  }

  dispose() {
    this.subscription.unsubscribe();
  }
}
