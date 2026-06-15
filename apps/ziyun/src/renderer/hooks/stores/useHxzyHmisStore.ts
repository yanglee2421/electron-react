import { ipc } from "#renderer/lib/ipc";
import { HXZY_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import { hxzy_hmis, type HXZY_HMIS } from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useHxzyHmisStore = create<HXZY_HMIS>()(
  persist(
    immer(() => hxzy_hmis.parse({})),
    {
      name: HXZY_HMIS_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
