import { ipc } from "#renderer/lib/ipc";
import { JTV_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import { jtv_hmis, type JTV_HMIS } from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useJTVHmisStore = create<JTV_HMIS>()(
  persist(
    immer(() => jtv_hmis.parse({})),
    {
      name: JTV_HMIS_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
