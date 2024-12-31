import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { WritableDraft } from "immer";
import localforage from "localforage";
import React from "react";

type Settings = {
  databasePath: string;
  databasePassword: string;
  databaseDsn: string;
  refetchInterval: number;
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
          databaseDsn: "MS Access Database",
          refetchInterval: 1000 * 2,
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
