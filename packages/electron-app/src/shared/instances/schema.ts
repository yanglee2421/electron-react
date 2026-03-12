import { z } from "zod";

export const themeMode = z.enum(["system", "light", "dark"]).default("system");

export type ThemeMode = z.infer<typeof themeMode>;

export const profile = z.object({
  appPath: z.string().default(""),
  encoding: z.string().default("gbk"),
  alwaysOnTop: z.boolean().default(false),
  mode: themeMode,
});

export type Profile = z.infer<typeof profile>;

export const kh_hmis = z.object({
  host: z.string().default(""),
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  tsgz: z.string().default(""),
  tszjy: z.string().default(""),
  tsysy: z.string().default(""),
});

export type KH_HMIS = z.infer<typeof kh_hmis>;

export const hxzy_hmis = z.object({
  ip: z.ipv4().default(""),
  port: z.number().int().min(1).max(65535).default(0),
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  gd: z.string().default(""),
});

export type HXZY_HMIS = z.infer<typeof hxzy_hmis>;

export const jtv_hmis = z.object({
  host: z.string().default(""),
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  unitCode: z.string().default(""),
  signature_prefix: z.string().default("W"),
});

export type JTV_HMIS = z.infer<typeof jtv_hmis>;

export const jtv_hmis_xuzhoubei = z.object({
  host: z.string().default(""),
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  username_prefix: z.string().default(""),
});

export type JTV_HMIS_XUZHOUBEI = z.infer<typeof jtv_hmis_xuzhoubei>;

export const jtv_hmis_guangzhoubei = z.object({
  get_host: z.string().default(""),
  post_host: z.string().default(""),
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  unitCode: z.string().default(""),
  signature_prefix: z.string().default("W"),
});

export type JTV_HMIS_Guangzhoubei = z.infer<typeof jtv_hmis_guangzhoubei>;

export const guangzhoujibaoduan = z.object({
  get_ip: z.ipv4().default("0.0.0.0"),
  get_port: z.number().int().min(1).max(65535).default(0),
  post_ip: z.ipv4().default("0.0.0.0"),
  post_port: z.number().int().min(1).max(65535).default(0),
  unitCode: z.string().default(""),
  signature_prefix: z.string().default("W"),
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
});

export type Guangzhoujibaoduan = z.infer<typeof guangzhoujibaoduan>;
