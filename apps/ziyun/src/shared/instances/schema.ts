import { z } from "zod";
import { zhCN } from "zod/locales";

z.config(zhCN());

const ipv4Schema = z.ipv4().default("0.0.0.0");
const portSchema = z.number().int().min(1).max(65535).default(80);

export const themeMode = z.enum(["system", "light", "dark"]).default("system");

export type ThemeMode = z.infer<typeof themeMode>;

export const profile = z.object({
  appPath: z.string().default(""),
  encoding: z.string().default("gbk"),
  alwaysOnTop: z.boolean().default(false),
  mode: themeMode,
  enableTray: z.boolean().default(false),
  silentStartUp: z.boolean().default(false),
  // For navigation
  showHxzyHmisMenu: z.boolean().default(false),
  showJtvHmisMenu: z.boolean().default(false),
  showGuangzhoubeiHmisMenu: z.boolean().default(false),
  showGuangzhoujibaoduanHmisMenu: z.boolean().default(false),
  showKhHmisMenu: z.boolean().default(false),
  showPLCMenu: z.boolean().default(false),

  // For Linux platform
  enableExternalDB: z.boolean().default(false),
  externalDBPath: z.string().default(""),
  enableHMISProxy: z.boolean().default(false),
  hmisProxyPort: portSchema.default(5003),
});

export type Profile = z.infer<typeof profile>;

export const kh_hmis = z.object({
  ip: ipv4Schema,
  port: portSchema,
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  enableAutoSubmit: z.boolean().default(false),
  autoSubmitDelay: z.number().default(1000 * 2),

  tsgz: z.string().default(""),
  tszjy: z.string().default(""),
  tsysy: z.string().default(""),
  tswxg: z.string().default(""),
  tszz: z.string().default(""),
  sbzz: z.string().default(""),
  zgld: z.string().default(""),

  ftpHost: z.ipv4().default("10.109.245.4"),
  ftpPort: z.number().int().min(1).max(65535).default(21),
  ftpUser: z.string().default("administrator"),
  ftpPassword: z.string().default("tech@963852"),
});

export type KH_HMIS = z.infer<typeof kh_hmis>;

export const hxzy_hmis = z.object({
  ip: ipv4Schema,
  port: portSchema,
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  enableAutoSubmit: z.boolean().default(false),
  autoSubmitDelay: z.number().default(1000 * 2),

  gd: z.string().default(""),
});

export type HXZY_HMIS = z.infer<typeof hxzy_hmis>;

export const jtv_hmis = z.object({
  ip: ipv4Schema,
  port: portSchema,
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  enableAutoSubmit: z.boolean().default(false),
  autoSubmitDelay: z.number().default(1000 * 2),

  unitCode: z.string().default(""),
  signature_prefix: z.string().default("W"),
  isZhMode: z.boolean().default(true),
});

export type JTV_HMIS = z.infer<typeof jtv_hmis>;

export const jtv_hmis_guangzhoubei = z.object({
  get_ip: ipv4Schema,
  get_port: portSchema,
  post_ip: ipv4Schema,
  post_port: portSchema,
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  enableAutoSubmit: z.boolean().default(false),
  autoSubmitDelay: z.number().default(1000 * 2),

  unitCode: z.string().default(""),
  signature_prefix: z.string().default("W"),
  isZhMode: z.boolean().default(true),
});

export type JTV_HMIS_Guangzhoubei = z.infer<typeof jtv_hmis_guangzhoubei>;

export const guangzhoujibaoduan = z.object({
  get_ip: ipv4Schema,
  get_port: portSchema,
  post_ip: ipv4Schema,
  post_port: portSchema,
  autoInput: z.boolean().default(false),
  autoUpload: z.boolean().default(false),
  autoUploadInterval: z.number().default(30),
  enableAutoSubmit: z.boolean().default(false),
  autoSubmitDelay: z.number().default(1000 * 2),

  unitCode: z.string().default(""),
  signature_prefix: z.string().default("W"),
});

export type Guangzhoujibaoduan = z.infer<typeof guangzhoujibaoduan>;

const btsSchema = z
  .array(z.object({ address: z.number().int(), description: z.string() }))
  .default([])
  .superRefine((val, ctx) => {
    const set = new Set();
    const hasDuplicate = val.some((i) => {
      const isInSet = set.has(i.address);

      if (!isInSet) {
        set.add(i.address);
      }

      return isInSet;
    });

    if (hasDuplicate) {
      ctx.addIssue("存在重复的地址");
    }
  });

export const plcSchema = z.object({
  x: btsSchema,
  y: btsSchema,
  m: btsSchema,
  d: btsSchema,
});

export type PLCSchema = z.infer<typeof plcSchema>;
