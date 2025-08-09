import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import React from "react";

type State = { name: "" };

export const useLocalStore = create<State>()(
  persist(
    immer(() => ({ name: "" })),
    {
      name: "useLocalStore",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useLocalStoreHasHydrated = () =>
  React.useSyncExternalStore(
    (onStateChange) => useLocalStore.persist.onFinishHydration(onStateChange),
    () => useLocalStore.persist.hasHydrated(),
    () => false,
  );
