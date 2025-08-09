import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type StoreState = {
  msg: string;
};

type Store = StoreState;

export const useStore = create<Store>()(
  immer(() => ({
    msg: "",
  })),
);
