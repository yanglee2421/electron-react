import { AppProtocol, AppTheme, AppTray, AppWindow } from "#main/infra";
import { asClass, createContainer } from "awilix";
import { Cmd } from "./cmd";
import { DB } from "./db";
import { Fuzhoudong } from "./fuzhoudong/fuzhoudong";
import { Guangzhoubei } from "./guangzhoubei";
import { Guangzhoucheliang } from "./guangzhoucheliang";
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
import { QT } from "./qt";
import type { AppCradle } from "./types";

export const container = createContainer<AppCradle>();

container.register({
  db: asClass(DB)
    .singleton()
    .disposer((i) => i.dispose()),
  kv: asClass(KV)
    .singleton()
    .disposer((i) => i.dispose()),
  logger: asClass(Logger)
    .singleton()
    .disposer((i) => i.dispose()),

  fuzhoudong: asClass(Fuzhoudong)
    .scoped()
    .disposer((i) => i.dispose()),
  guangzhoubei: asClass(Guangzhoubei)
    .scoped()
    .disposer((i) => i.dispose()),
  guangzhoucheliang: asClass(Guangzhoucheliang)
    .scoped()
    .disposer((i) => i.dispose()),
  guangzhoujibaoduan: asClass(JTV_HMIS_Guangzhoujibaoduan)
    .scoped()
    .disposer((i) => i.dispose()),
  hxzy: asClass(Hxzy)
    .scoped()
    .disposer((i) => i.dispose()),
  jtv: asClass(JTV)
    .scoped()
    .disposer((i) => i.dispose()),
  kh: asClass(KH)
    .scoped()
    .disposer((i) => i.dispose()),

  qt: asClass(QT)
    .scoped()
    .disposer((i) => i.dispose()),
  image: asClass(ImageModule)
    .scoped()
    .disposer((i) => i.dispose()),
  mdb: asClass(MDB)
    .scoped()
    .disposer((i) => i.dispose()),
  plc: asClass(PLC)
    .scoped()
    .disposer((i) => i.dispose()),
  printer: asClass(Printer)
    .scoped()
    .disposer((i) => i.dispose()),
  profile: asClass(Profile)
    .scoped()
    .disposer((i) => i.dispose()),
  cmd: asClass(Cmd)
    .scoped()
    .disposer((i) => i.dispose()),
  appProtocol: asClass(AppProtocol)
    .scoped()
    .disposer((i) => i.dispose()),
  appTheme: asClass(AppTheme)
    .scoped()
    .disposer((i) => i.dispose()),
  appTray: asClass(AppTray)
    .scoped()
    .disposer((i) => i.dispose()),
  appWindow: asClass(AppWindow)
    .scoped()
    .disposer((i) => i.dispose()),
});
