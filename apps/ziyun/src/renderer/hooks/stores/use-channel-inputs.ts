import { ipc } from "#renderer/lib/ipc";
import {
  channelInputSchema,
  type CHANNEL_INPUTS,
} from "#shared/instances/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

const initializeState = () => channelInputSchema.parse({});

export const useChannelInputs = create<CHANNEL_INPUTS>()(
  persist(immer(initializeState), {
    name: "useChannelInputs",
    storage: createJSONStorage(() => ipc),
  }),
);
