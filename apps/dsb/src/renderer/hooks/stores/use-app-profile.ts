import { ipc } from "#renderer/lib/ipc";
import { APP_PROFILE_STORAGE_KEY } from "#shared/constants/app-profile";
import type { AppProfileType } from "#shared/functions/app-profile";
import { createAppProfileSchema } from "#shared/functions/app-profile";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const schema = createAppProfileSchema();

export const useAppProfile = create<AppProfileType>()(
  persist(
    immer(() => schema.parse({})),
    {
      name: APP_PROFILE_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
