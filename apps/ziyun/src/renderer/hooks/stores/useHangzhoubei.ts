import { ipc } from "#renderer/lib/ipc";
import { HANGZHOUBEI_STORAGE_KEY } from "#shared/instances/constants";
import type { HANGZHOUBEI } from "#shared/instances/schema";
import { hangzhoubei } from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useHangzhoubei = create<HANGZHOUBEI>()(
  persist(
    immer(() => hangzhoubei.parse({})),
    {
      name: HANGZHOUBEI_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
