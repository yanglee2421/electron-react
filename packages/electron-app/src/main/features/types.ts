import type { DB } from "#main/features/db";
import type { Cmd } from "./cmd";
import type { KV } from "./kv";
import type { MDB } from "./mdb";
import type { PLC } from "./plc";
import type { Profile } from "./profile";

export interface AppCradle {
  dbPath: string;
  cmd: Cmd;
  db: DB;
  kv: KV;
  mdb: MDB;
  plc: PLC;
  profile: Profile;
}
