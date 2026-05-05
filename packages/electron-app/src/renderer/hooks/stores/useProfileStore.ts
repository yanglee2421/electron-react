import { ipc } from "#renderer/shared/instances/ipc";
import { PROFILE_STORAGE_KEY } from "#shared/instances/constants";
import { profile, type Profile } from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useProfileStore = create<Profile>()(
  persist(
    immer(() => profile.parse({})),
    {
      name: PROFILE_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
