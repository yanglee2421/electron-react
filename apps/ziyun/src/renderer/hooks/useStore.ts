import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type State = {
  msg: string;
};

const initialState = (): State => ({
  msg: "",
});

export const useStore = create<State>()(immer(initialState));
