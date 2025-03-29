import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { WritableDraft } from "immer";
import React from "react";

type State = {
  mode: "light" | "dark" | "system";
  alwaysOnTop: boolean;
};

type Actions = {
  set(
    nextStateOrUpdater:
      | State
      | Partial<State>
      | ((state: WritableDraft<State>) => void)
  ): void;
};

type Store = State & Actions;

export const useLocalStore = create<Store>()(
  persist(
    immer((set) => ({
      mode: "system",
      alwaysOnTop: false,
      set,
    })),
    {
      name: "useLocalStore",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useLocalStoreHasHydrated = () =>
  React.useSyncExternalStore(
    (onStateChange) => useLocalStore.persist.onFinishHydration(onStateChange),
    () => useLocalStore.persist.hasHydrated(),
    () => false
  );
