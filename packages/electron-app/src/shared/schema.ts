import { z } from "zod";

export const guangzhoujibaoduan = z.object({
  get_ip: z.ipv4(),
  get_port: z.number().int().min(1).max(65535),
  post_ip: z.ipv4(),
  post_port: z.number().int().min(1).max(65535),
  unitCode: z.string(),
  signature_prefix: z.string(),
  autoUpload: z.boolean(),
  autoUploadInterval: z.number(),
});
