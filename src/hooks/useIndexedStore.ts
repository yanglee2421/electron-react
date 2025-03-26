import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { WritableDraft } from "immer";
import localforage from "localforage";
import React from "react";

type Settings = {
  activate_key: string;
  databasePath: string;
  driverPath: string;

  // HMIS/KMIS
  api_ip: string;
  api_port: string;
  autoInput: boolean;
  autoUpload: boolean;
};

type StoreState = {
  settings: Settings;
};

type StoreActions = {
  set(
    nextStateOrUpdater:
      | StoreState
      | Partial<StoreState>
      | ((state: WritableDraft<StoreState>) => void)
  ): void;
};

export type Store = StoreState & StoreActions;

export const useIndexedStore = create<Store>()(
  persist(
    immer((set) => ({
      set,
      settings: {
        databasePath: "D:\\数据12\\local.mdb",
        driverPath: "",
        api_ip: "",
        api_port: "",
        activate_key: "",
        autoInput: true,
        autoUpload: true,
      },
    })),
    {
      name: "useIndexedStore",
      storage: createJSONStorage(() => localforage),
      version: 2,
    }
  )
);

export const useIndexedStoreHasHydrated = () =>
  React.useSyncExternalStore(
    (onStateChange) => useIndexedStore.persist.onFinishHydration(onStateChange),
    () => useIndexedStore.persist.hasHydrated(),
    () => false
  );
