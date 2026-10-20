import type { AppDB } from "./app-db/app-db";
import type { AppProfile } from "./app-profile/app-profile";
import type { Cmd } from "./cmd";
import type { KV } from "./kv/kv";

export interface AppCradle {
  DB_PATH: string;

  kv: KV;

  appDB: AppDB;
  appProfile: AppProfile;
  cmd: Cmd;
}
