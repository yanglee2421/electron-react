import { ipc } from "#renderer/shared/instances/ipc";
import { JTV_HMIS_GUANGZHOUBEI_STORAGE_KEY } from "#shared/instances/constants";
import {
  jtv_hmis_guangzhoubei,
  type JTV_HMIS_Guangzhoubei,
} from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useGuangzhoubei = create<JTV_HMIS_Guangzhoubei>()(
  persist(
    immer(() => jtv_hmis_guangzhoubei.parse({})),
    {
      name: JTV_HMIS_GUANGZHOUBEI_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
