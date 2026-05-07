import type { DB } from "#main/features/db";
import type { Cmd } from "./cmd";
import type { Guangzhoubei } from "./guangzhoubei";
import type { JTV_HMIS_Guangzhoujibaoduan } from "./guangzhoujibaoduan";
import type { Hxzy } from "./hxzy";
import type { ImageModule } from "./image";
import type { JTV } from "./jtv";
import type { KH } from "./kh_hmis";
import type { KV } from "./kv";
import type { Logger } from "./logger";
import type { MDB } from "./mdb";
import type { PLC } from "./plc";
import type { Printer } from "./printer";
import type { Profile } from "./profile";

export interface AppCradle {
  dbPath: string;

  cmd: Cmd;
  db: DB;
  guangzhoubei: Guangzhoubei;
  guangzhoujibaoduan: JTV_HMIS_Guangzhoujibaoduan;
  hxzy: Hxzy;
  image: ImageModule;
  jtv: JTV;
  kh: KH;
  kv: KV;
  logger: Logger;
  mdb: MDB;
  plc: PLC;
  printer: Printer;
  profile: Profile;
}
