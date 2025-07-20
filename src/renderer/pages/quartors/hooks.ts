import type { WritableDraft } from "immer";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type State = {
  date: string | null;
  pageIndex: number;
  pageSize: number;
  username: string;
  whModel: string;
  idsWheel: string;
  result: string;
};

type Actions = {
  set(
    nextStateOrUpdater:
      | State
      | Partial<State>
      | ((state: WritableDraft<State>) => void),
  ): void;
};

type Store = State & Actions;

export const useSessionStore = create<Store>()(
  persist(
    immer((set) => ({
      set,
      date: new Date().toISOString(),
      pageIndex: 0,
      pageSize: 100,
      username: "",
      whModel: "",
      idsWheel: "",
      result: "",
    })),
    {
      storage: createJSONStorage(() => sessionStorage),
      name: "useSessionStore:quartors",
    },
  ),
);
