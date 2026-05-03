import type { DB } from "#main/features/db";
import type { Cmd } from "./cmd";
import type { ImageModule } from "./image";
import type { KV } from "./kv";
import type { Logger } from "./logger";
import type { MDB } from "./mdb";
import type { PLC } from "./plc";
import type { Profile } from "./profile";

export interface AppCradle {
  dbPath: string;
  cmd: Cmd;
  db: DB;
  image: ImageModule;
  kv: KV;
  logger: Logger;
  mdb: MDB;
  plc: PLC;
  profile: Profile;
}
