import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { WritableDraft } from "immer";
import localforage from "localforage";
import React from "react";

type Settings = {
  databasePath: string;
  databasePassword: string;
};

type StoreState = {
  settings: Settings;
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

export const useIndexedStore = create<Store>()(
  persist(
    immer(
      (set) => ({
        set,
        settings: {
          databasePath: "D:\\数据12\\local.mdb",
          databasePassword: "Joney",
        },
      }),
    ),
    {
      name: "useIndexedStore",
      storage: createJSONStorage(() => localforage),
      version: 1,
    },
  ),
);

export const useIndexedStoreHasHydrated = () =>
  React.useSyncExternalStore(
    (onStateChange) => useIndexedStore.persist.onFinishHydration(onStateChange),
    () => useIndexedStore.persist.hasHydrated(),
    () => false,
  );
