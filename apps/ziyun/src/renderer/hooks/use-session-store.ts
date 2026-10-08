import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const schema = z.object({
  qt53aIds: z.number().array().default([]),
  mdb53aIds: z.string().array().default([]),
});

type State = z.infer<typeof schema>;

const initializeState = () => schema.parse({});
export const useSessionStore = create<State>()(
  persist(immer(initializeState), {
    storage: createJSONStorage(() => window.sessionStorage),
    name: "useSessionStore",
  }),
);
