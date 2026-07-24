import { ipc } from "#renderer/lib/ipc";
import { GUANGZHOU_CHELIANG_STORAGE_KEY } from "#shared/instances/constants";
import type { GuangzhoucheliangType } from "#shared/instances/schema";
import { guangzhoucheliang } from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const useGuangzhoucheliang = create<GuangzhoucheliangType>()(
  persist(
    immer(() => guangzhoucheliang.parse({})),
    {
      name: GUANGZHOU_CHELIANG_STORAGE_KEY,
      storage: createJSONStorage(() => ipc),
    },
  ),
);