import { z } from "zod";

export const createAppProfileSchema = () => {
  return z.object({
    enableCmd: z.boolean().default(false),
  });
};

export type AppProfileType = z.infer<ReturnType<typeof createAppProfileSchema>>;
