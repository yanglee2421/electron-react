import { PROFILE_STORAGE_KEY } from "#shared/instances/constants";
import type { Profile as AppProfile } from "#shared/instances/schema";
import { profile } from "#shared/instances/schema";
import type { Subscription } from "rxjs";
import { BehaviorSubject, filter, map } from "rxjs";
import type { AppCradle } from "../types";

export class Profile {
  readonly state$: BehaviorSubject<AppProfile>;
  private subscriptions: Subscription[];

  constructor({ kv }: AppCradle) {
    const stateJson = kv.getItem(PROFILE_STORAGE_KEY);
    const data = stateJson ? JSON.parse(stateJson).state : {};
    const initialState = profile.parse(data);
    this.state$ = new BehaviorSubject<AppProfile>(initialState);

    const sub = kv.events$
      .pipe(
        filter((e) => e.key === PROFILE_STORAGE_KEY),
        map((e) => {
          switch (e.action) {
            case "set":
              return profile.parse(e.value ? JSON.parse(e.value).state : {});
            case "remove":
            case "clear":
              return profile.parse({});
          }
        }),
      )
      .subscribe(this.state$);

    this.subscriptions = [sub];
  }

  dispose() {
    this.state$.complete();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  get state(): AppProfile {
    return this.state$.getValue();
  }
}