import { PROFILE_STORAGE_KEY } from "#shared/instances/constants";
import type { Profile as AppProfile } from "#shared/instances/schema";
import { profile } from "#shared/instances/schema";
import { BehaviorSubject } from "rxjs";
import type { KV } from "../kv";
import type { AppCradle } from "../types";

export class Profile {
  readonly state$: BehaviorSubject<AppProfile>;
  private kv: KV;

  constructor({ kv }: AppCradle) {
    this.kv = kv;
    const jsonText = this.kv.getItem(PROFILE_STORAGE_KEY);
    const data = jsonText ? JSON.parse(jsonText) : {};
    const initialState = profile.parse(data.state);
    this.state$ = new BehaviorSubject<AppProfile>(initialState);

    this.kv.events$.subscribe((event) => {
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

  get state(): AppProfile {
    return this.state$.getValue();
  }
}
