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
  home_path: string;
};

export type History = {
  id: string;
  barCode: string;
  zh: string;
  date: string;
  isUploaded: boolean;
};

type HXZY_HMIS = {
  history: History[];
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
};

type JTV_HMIS = {
  history: History[];
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
};

type StoreState = {
  settings: Settings;
  hxzy_hmis: HXZY_HMIS;
  jtv_hmis: JTV_HMIS;
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
        activate_key: "",
        home_path: "/settings",
      },
      hxzy_hmis: {
        host: "",
        history: [],
        autoInput: true,
        autoUpload: true,
        autoUploadInterval: 1000 * 30,
      },
      jtv_hmis: {
        host: "",
        history: [],
        autoInput: true,
        autoUpload: true,
        autoUploadInterval: 1000 * 30,
      },
    })),
    {
      name: "useIndexedStore",
      storage: createJSONStorage(() => localforage),
      version: 3,
    }
  )
);

export const useIndexedStoreHasHydrated = () =>
  React.useSyncExternalStore(
    (onStateChange) => useIndexedStore.persist.onFinishHydration(onStateChange),
    () => useIndexedStore.persist.hasHydrated(),
    () => false
  );
