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

export type Log = {
  id: string;
  type: string;
  message: string;
  date: string;
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
  gd: string;
};

type JTV_HMIS = {
  history: History[];
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
  unitCode: string;
};

export type HistoryXuzhoubei = History & {
  PJ_ZZRQ: string; // 制造日期
  PJ_ZZDW: string; // 制造单位
  PJ_SCZZRQ: string; // 首次组装日期
  PJ_SCZZDW: string; // 首次组装单位
  PJ_MCZZRQ: string; // 末次组装日期
  PJ_MCZZDW: string; // 末次组装单位
};

type JTV_HMIS_XUZHOUBEI = {
  history: HistoryXuzhoubei[];
  host: string;
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
};

type StoreState = {
  settings: Settings;
  logs: Log[];
  hxzy_hmis: HXZY_HMIS;
  jtv_hmis: JTV_HMIS;
  jtv_hmis_xuzhoubei: JTV_HMIS_XUZHOUBEI;
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
      logs: [],
      hxzy_hmis: {
        host: "",
        history: [],
        autoInput: true,
        autoUpload: true,
        autoUploadInterval: 1000 * 30,
        gd: "",
      },
      jtv_hmis: {
        host: "",
        history: [],
        autoInput: true,
        autoUpload: true,
        autoUploadInterval: 1000 * 30,
        unitCode: "",
      },
      jtv_hmis_xuzhoubei: {
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
      version: 4,
    }
  )
);

export const useIndexedStoreHasHydrated = () =>
  React.useSyncExternalStore(
    (onStateChange) => useIndexedStore.persist.onFinishHydration(onStateChange),
    () => useIndexedStore.persist.hasHydrated(),
    () => false
  );
