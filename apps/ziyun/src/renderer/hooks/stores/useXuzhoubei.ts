import { ipc } from "#renderer/lib/ipc";
import { JTV_HMIS_XUZHOUBEI_STORAGE_KEY } from "#shared/instances/constants";
import {
  jtv_hmis_xuzhoubei,
  type JTV_HMIS_XUZHOUBEI,
} from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useXuzhoubei = create<JTV_HMIS_XUZHOUBEI>()(
  persist(
    immer(() => jtv_hmis_xuzhoubei.parse({})),
    {
      name: JTV_HMIS_XUZHOUBEI_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
