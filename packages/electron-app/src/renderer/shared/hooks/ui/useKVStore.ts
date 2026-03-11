import { ipc } from "#renderer/shared/instances/ipc";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const storeInitializer = () => {
  return {};
};

export const useKVStore = create()(
  persist(immer(storeInitializer), {
    name: "useKVStore",
    storage: createJSONStorage(() => ipc),
  }),
);
