import { asClass, createContainer } from "awilix";
import { Cmd } from "./cmd";
import { DB } from "./db";
import { Guangzhoubei } from "./guangzhoubei";
import { JTV_HMIS_Guangzhoujibaoduan } from "./guangzhoujibaoduan";
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
    .disposer((db) => db.dispose()),
  guangzhoubei: asClass(Guangzhoubei)
    .singleton()
    .disposer((instance) => instance.dispose()),
  guangzhoujibaoduan: asClass(JTV_HMIS_Guangzhoujibaoduan)
    .singleton()
    .disposer((instance) => instance.dispose()),
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
  plc: asClass(PLC).singleton(),
  printer: asClass(Printer)
    .singleton()
    .disposer((printer) => printer.dispose()),
  profile: asClass(Profile)
    .singleton()
    .disposer((profile) => profile.dispose()),
});
