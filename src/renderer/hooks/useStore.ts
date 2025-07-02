import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { WritableDraft } from "immer";

type StoreState = {
  msg: string;
};

type StoreActions = {
  set(
    nextStateOrUpdater:
      | StoreState
      | Partial<StoreState>
      | ((state: WritableDraft<StoreState>) => void),
  ): void;
};

type Store = StoreState & StoreActions;

export const useStore = create<Store>()(
  immer((set) => ({
    set,
    msg: "",
  })),
);
