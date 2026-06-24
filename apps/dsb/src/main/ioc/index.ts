import { asClass, createContainer } from "awilix";
import { AppDB } from "./app-db/app-db";
import type { AppCradle } from "./types";

export const container = createContainer<AppCradle>({
  injectionMode: "PROXY",
  strict: true,
});

container.register({
  appDb: asClass(AppDB)
    .singleton()
    .disposer((i) => i.dispose()),
});
