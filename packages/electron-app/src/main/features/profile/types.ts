import type { Profile } from "#shared/instances/schema";

export interface IPCContract {
  "profile/get": {
    args: void;
    return: Profile;
  };
}
