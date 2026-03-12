import { ipc } from "#renderer/shared/instances/ipc";
import { KH_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import { type KH_HMIS, kh_hmis } from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useKhHmisStore = create<KH_HMIS>()(
  persist(
    immer(() => kh_hmis.parse({})),
    {
      name: KH_HMIS_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
