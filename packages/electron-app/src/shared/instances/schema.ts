import { z } from "zod";

export const guangzhoujibaoduan = z.object({
  get_ip: z.ipv4().default("0.0.0.0"),
  get_port: z.number().int().min(1).max(65535).default(0),
  post_ip: z.ipv4().default("0.0.0.0"),
  post_port: z.number().int().min(1).max(65535).default(0),
  unitCode: z.string().default(""),
  signature_prefix: z.string().default("W"),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
});

export type Guangzhoujibaoduan = z.infer<typeof guangzhoujibaoduan>;

export const themeMode = z.enum(["system", "light", "dark"]).default("system");

export type ThemeMode = z.infer<typeof themeMode>;

export const profile = z.object({
  appPath: z.string().default(""),
  encoding: z.string().default("gbk"),
  alwaysOnTop: z.boolean().default(false),
  mode: themeMode,
});

export type Profile = z.infer<typeof profile>;
