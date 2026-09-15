import { ipc } from "#renderer/lib/ipc";
import { FUZHOUDONG_STORAGE_KEY } from "#shared/instances/constants";
import type { FUZHOUDONG } from "#shared/instances/schema";
import { fuzhoudong } from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useFuzhoudong = create<FUZHOUDONG>()(
  persist(
    immer(() => fuzhoudong.parse({})),
    {
      name: FUZHOUDONG_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);
