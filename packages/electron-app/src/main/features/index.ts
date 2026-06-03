import { Win } from "#main/infra/win";
import { asClass, createContainer } from "awilix";
import { AppTray } from "./app-tray";
import { Cmd } from "./cmd";
import { DB } from "./db";
import { ExternalDB } from "./external-db";
import { Guangzhoubei } from "./guangzhoubei";
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
  appTray: asClass(AppTray)
    .singleton()
    .disposer((instance) => instance.dispose()),
  cmd: asClass(Cmd).singleton(),
  db: asClass(DB)
    .singleton()
    .disposer((db) => db.dispose()),
  externalDB: asClass(ExternalDB)
    .singleton()
    .disposer((instance) => instance.dispose()),
  guangzhoubei: asClass(Guangzhoubei)
    .singleton()
    .disposer((instance) => instance.dispose()),
  guangzhoujibaoduan: asClass(JTV_HMIS_Guangzhoujibaoduan)
    .singleton()
    .disposer((instance) => instance.dispose()),
  hmisProxy: asClass(HmisProxy)
    .singleton()
    .disposer((hmisProxy) => hmisProxy.dispose()),
  hxzy: asClass(Hxzy)
    .singleton()
    .disposer((instance) => instance.dispose()),
  image: asClass(ImageModule)
    .singleton()
    .disposer((image) => image.dispose()),
  jtv: asClass(JTV)
    .singleton()
    .disposer((instance) => instance.dispose()),
  kh: asClass(KH)
    .singleton()
    .disposer((instance) => instance.dispose()),
  kv: asClass(KV)
    .singleton()
    .disposer((kv) => kv.dispose()),
  logger: asClass(Logger)
    .singleton()
    .disposer((logger) => logger.dispose()),
  mdb: asClass(MDB)
    .singleton()
    .disposer((mdb) => mdb.dispose()),
  plc: asClass(PLC)
    .singleton()
    .disposer((plc) => plc.dispose()),
  printer: asClass(Printer)
    .singleton()
    .disposer((printer) => printer.dispose()),
  profile: asClass(Profile)
    .singleton()
    .disposer((profile) => profile.dispose()),

  win: asClass(Win)
    .singleton()
    .disposer((win) => win.dispose()),
});
