import type { AppDB } from "./app-db/app-db";

export interface AppCradle {
  DB_PATH: string;

  appDb: AppDB;
}
