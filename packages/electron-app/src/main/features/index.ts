import { asClass, createContainer } from "awilix";
import { Cmd } from "./cmd";
import { DB } from "./db";
import { ImageModule } from "./image";
import { KV } from "./kv";
import { Logger } from "./logger";
import { MDB } from "./mdb";
import { PLC } from "./plc";
import { Profile } from "./profile";
import type { AppCradle } from "./types";

export const container = createContainer<AppCradle>();

container.register({
  cmd: asClass(Cmd).singleton(),
  db: asClass(DB).singleton(),
  image: asClass(ImageModule).singleton(),
  kv: asClass(KV).singleton(),
  logger: asClass(Logger).singleton(),
  mdb: asClass(MDB).singleton(),
  plc: asClass(PLC).singleton(),
  profile: asClass(Profile).singleton(),
});
