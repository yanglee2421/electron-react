import { asClass, createContainer } from "awilix";
import { AppDB } from "./app-db/app-db";
import { AppProfile } from "./app-profile/app-profile";
import { KV } from "./kv/kv";
import type { AppCradle } from "./types";

export const container = createContainer<AppCradle>({
  injectionMode: "PROXY",
  strict: true,
});

container.register({
  kv: asClass(KV)
    .singleton()
    .disposer((i) => i.dispose()),

  appDB: asClass(AppDB)
    .singleton()
    .disposer((i) => i.dispose()),
  appProfile: asClass(AppProfile).singleton(),
});
