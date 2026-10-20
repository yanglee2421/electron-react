import { ipc } from "#renderer/lib/ipc";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const CHANNEL_INPUTS_STORAGE_KEY = "channel_inputs";

const defaultValue = () => {
  const value = [];

  for (let i = 1; i < 32; i++) {
    if (i < 19) {
      value.push({
        channel: `${i}-0`,
        db: 100,
        enabled: true,
        gates: [],
      });
    } else {
      value.push({
        channel: `0-${i - 18}`,
        db: 100,
        enabled: true,
        gates: [],
      });
    }
  }

  return value;
};

export const channelInputSchema = z.object({
  open: z.boolean().default(false),
  interval: z.int().default(64),
  inputs: z
    .object({
      channel: z.string(),
      db: z.number(),
      enabled: z.boolean(),
      gates: z
        .object({
          width: z.number(),
          x: z.number(),
          y: z.number(),
        })
        .array()
        .default([]),
    })
    .array()
    .default(defaultValue()),
});
export type CHANNEL_INPUTS = z.infer<typeof channelInputSchema>;

const initializeState = () => channelInputSchema.parse({});

export const useChannelInputs = create<CHANNEL_INPUTS>()(
  persist(immer(initializeState), {
    name: CHANNEL_INPUTS_STORAGE_KEY,
    storage: createJSONStorage(() => ipc),
    version: 2,
  }),
);
