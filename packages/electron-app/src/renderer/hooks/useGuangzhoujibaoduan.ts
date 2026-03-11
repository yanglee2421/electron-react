import { getKVStorage } from "#renderer/shared/instances/kv";
import { guangzhoujibaoduan } from "#shared/initializer";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const storeOption = guangzhoujibaoduan();

type GuangzhoujibaoduanStore = ReturnType<typeof storeOption.initializer>;

export const useGuangzhoujibaoduan = create<GuangzhoujibaoduanStore>()(
  persist(immer(storeOption.initializer), {
    name: storeOption.storageKey,
    storage: createJSONStorage(getKVStorage),
  }),
);
