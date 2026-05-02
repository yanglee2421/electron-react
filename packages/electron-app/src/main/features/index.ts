import { asClass, createContainer } from "awilix";
import { Cmd } from "./cmd";
import { DB } from "./db";
import { KV } from "./kv";
import { MDB } from "./mdb";
import { PLC } from "./plc";
import { Profile } from "./profile";
import type { AppCradle } from "./types";

export const container = createContainer<AppCradle>();

container.register({
  cmd: asClass(Cmd).singleton(),
  db: asClass(DB).singleton(),
  kv: asClass(KV).singleton(),
  mdb: asClass(MDB).singleton(),
  plc: asClass(PLC).singleton(),
  profile: asClass(Profile).singleton(),
});
