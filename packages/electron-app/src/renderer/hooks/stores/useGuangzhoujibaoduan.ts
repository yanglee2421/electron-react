import { ipc } from "#renderer/shared/instances/ipc";
import { GUANGZHOU_JIBAODUAN_STORAGE_KEY } from "#shared/instances/constants";
import {
  guangzhoujibaoduan,
  type Guangzhoujibaoduan,
} from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useGuangzhoujibaoduan = create<Guangzhoujibaoduan>()(
  persist(
    immer(() => guangzhoujibaoduan.parse({})),
    {
      name: GUANGZHOU_JIBAODUAN_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
