import { ipc } from "#renderer/lib/ipc";
import { JTV_HMIS_GUANGZHOUBEI_STORAGE_KEY } from "#shared/instances/constants";
import type { JTV_HMIS_Guangzhoubei } from "#shared/instances/schema";
import { guangzhoubei } from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useGuangzhoubei = create<JTV_HMIS_Guangzhoubei>()(
  persist(
    immer(() => guangzhoubei.parse({})),
    {
      name: JTV_HMIS_GUANGZHOUBEI_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);