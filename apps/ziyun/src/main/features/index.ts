import { AppProtocol, AppTheme, AppTray, AppWindow } from "#main/infra";
import { asClass, createContainer } from "awilix";
import { Cmd } from "./cmd";
import { DB } from "./db";
import { ExternalDB } from "./external-db";
import { Guangzhoubei } from "./guangzhoubei";
import { Guangzhoucheliang } from "./guangzhoucheliang";
import { JTV_HMIS_Guangzhoujibaoduan } from "./guangzhoujibaoduan";
import { HmisProxy } from "./hmis-proxy";
import { Hxzy } from "./hxzy/hxzy";
import { ImageModule } from "./image";
import { JTV } from "./jtv";
import { KH } from "./kh_hmis";
import { KV } from "./kv";
import { Logger } from "./logger";
import { MDB } from "./mdb";
import { PLC } from "./plc";
import { Printer } from "./printer";
import { Profile } from "./profile";
import type { AppCradle } from "./types";

export const container = createContainer<AppCradle>();

container.register({
  cmd: asClass(Cmd).singleton(),
  db: asClass(DB)
    .singleton()
    .disposer((i) => i.dispose()),
  externalDB: asClass(ExternalDB)
    .singleton()
    .disposer((i) => i.dispose()),
  guangzhoubei: asClass(Guangzhoubei)
    .singleton()
    .disposer((i) => i.dispose()),
  guangzhoucheliang: asClass(Guangzhoucheliang)
    .singleton()
    .disposer((i) => i.dispose()),
  guangzhoujibaoduan: asClass(JTV_HMIS_Guangzhoujibaoduan)
    .singleton()
    .disposer((i) => i.dispose()),
  hmisProxy: asClass(HmisProxy)
    .singleton()
    .disposer((i) => i.dispose()),
  hxzy: asClass(Hxzy)
    .singleton()
    .disposer((i) => i.dispose()),
  image: asClass(ImageModule)
    .singleton()
    .disposer((i) => i.dispose()),
  jtv: asClass(JTV)
    .singleton()
    .disposer((i) => i.dispose()),
  kh: asClass(KH)
    .singleton()
    .disposer((i) => i.dispose()),
  kv: asClass(KV)
    .singleton()
    .disposer((i) => i.dispose()),
  logger: asClass(Logger)
    .singleton()
    .disposer((i) => i.dispose()),
  mdb: asClass(MDB)
    .singleton()
    .disposer((i) => i.dispose()),
  plc: asClass(PLC)
    .singleton()
    .disposer((i) => i.dispose()),
  printer: asClass(Printer)
    .singleton()
    .disposer((i) => i.dispose()),
  profile: asClass(Profile)
    .singleton()
    .disposer((i) => i.dispose()),

  appProtocol: asClass(AppProtocol)
    .singleton()
    .disposer((i) => i.dispose()),
  appTheme: asClass(AppTheme)
    .singleton()
    .disposer((i) => i.dispose()),
  appTray: asClass(AppTray)
    .singleton()
    .disposer((i) => i.dispose()),
  appWindow: asClass(AppWindow)
    .singleton()
    .disposer((i) => i.dispose()),
});