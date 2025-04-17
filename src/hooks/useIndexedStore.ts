import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { WritableDraft } from "immer";
import localforage from "localforage";
import React from "react";

type State = {
  home_path: string;
};

type Actions = {
  set(
    nextStateOrUpdater:
      | State
      | Partial<State>
      | ((state: WritableDraft<State>) => void),
  ): void;
};

export type Store = State & Actions;

export const useIndexedStore = create<Store>()(
  persist(
    immer((set) => ({
      set,
      home_path: "/settings",
    })),
    {
      name: "useIndexedStore",
      storage: createJSONStorage(() => localforage),
      version: 4,
    },
  ),
);

export const useIndexedStoreHasHydrated = () =>
  React.useSyncExternalStore(
    (onStateChange) => useIndexedStore.persist.onFinishHydration(onStateChange),
    () => useIndexedStore.persist.hasHydrated(),
    () => false,
  );
