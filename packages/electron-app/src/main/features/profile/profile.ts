import { PROFILE_STORAGE_KEY } from "#shared/instances/constants";
import type { Profile as AppProfile } from "#shared/instances/schema";
import { profile } from "#shared/instances/schema";
import type { Subscription } from "rxjs";
import { BehaviorSubject } from "rxjs";
import type { AppCradle } from "../types";

export class Profile {
  readonly state$: BehaviorSubject<AppProfile>;
  private subscription: Subscription;

  constructor({ kv }: AppCradle) {
    const stateJson = kv.getItem(PROFILE_STORAGE_KEY);
    const data = stateJson ? JSON.parse(stateJson) : {};
    const initialState = profile.parse(data.state);
    this.state$ = new BehaviorSubject<AppProfile>(initialState);

    this.subscription = kv.events$.subscribe((event) => {
      if (event.key !== PROFILE_STORAGE_KEY) {
        return;
      }

      switch (event.action) {
        case "set":
          this.state$.next(
            profile.parse(event.value ? JSON.parse(event.value).state : {}),
          );
          break;
        case "remove":
        case "clear":
          this.state$.next(profile.parse({}));
          break;
      }
    });
  }

  dispose() {
    this.subscription.unsubscribe();
  }

  get state(): AppProfile {
    return this.state$.getValue();
  }
}
