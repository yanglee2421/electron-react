import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type State = {
  date: string | null;
  pageIndex: number;
  pageSize: number;
  username: string;
  whModel: string;
  idsWheel: string;
  result: string;
};

const initialState = (): State => ({
  date: new Date().toISOString(),
  pageIndex: 0,
  pageSize: 100,
  username: "",
  whModel: "",
  idsWheel: "",
  result: "",
});

export const useSessionStore = create<State>()(
  persist(immer(initialState), {
    storage: createJSONStorage(() => sessionStorage),
    name: "useSessionStore:quartors",
  }),
);
