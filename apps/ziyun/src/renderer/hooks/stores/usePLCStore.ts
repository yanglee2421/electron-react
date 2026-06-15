import { ipc } from "#renderer/lib/ipc";
import { plcSchema, type PLCSchema } from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const storeInitializer = () => plcSchema.parse({});

export const usePLCStore = create<PLCSchema>()(
  persist(immer(storeInitializer), {
    name: "usePLCStore",
    storage: createJSONStorage(() => ipc),
  }),
);
