import type { AppCradle } from "#main/features/types";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { relations } from "./relations";
import * as schema from "./schema";
import type { DBClient } from "./types";

export class DB {
  readonly client: DBClient;

  constructor({ dbPath }: AppCradle) {
    const database = new Database(dbPath);
    this.client = drizzle({ client: database, schema, relations });
  }

  migrate(migrationsFolder: string) {
    migrate(this.client, { migrationsFolder });
  }
  dispose() {
    this.client.$client.close();
  }
  export(destinationFile: string) {
    this.client.$client.backup(destinationFile);
  }
}
