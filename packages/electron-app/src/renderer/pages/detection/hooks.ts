import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createJSONStorage, persist } from "zustand/middleware";

type State = {
  date: string | null;
  pageIndex: number;
  pageSize: number;
  username: string;
  whModel: string;
  idsWheel: string;
  result: string;
};

const storeInitializer = (): State => ({
  date: new Date().toISOString(),
  pageIndex: 0,
  pageSize: 100,
  username: "admin",
  whModel: "",
  idsWheel: "",
  result: "",
});

export const useSessionStore = create<State>()(
  persist(immer(storeInitializer), {
    storage: createJSONStorage(() => sessionStorage),
    name: "useSessionStore:detections",
  }),
);
