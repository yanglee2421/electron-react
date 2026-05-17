import type { AppCradle } from "#main/features/types";
import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { relations } from "./relations";
import * as schema from "./schema";
import type { DBClient } from "./types";

export class DB {
  readonly client: DBClient;
  private dbPath: string;

  constructor({ dbPath }: AppCradle) {
    this.dbPath = dbPath;
    const client = new DatabaseSync(dbPath);
    this.client = drizzle({ client, schema, relations });
  }

  migrate(migrationsFolder: string) {
    migrate(this.client, { migrationsFolder });
  }
  dispose() {
    this.client.$client.close();
  }
  export(destinationFile: string) {
    // this.client.$client.backup(destinationFile);
    fs.promises.cp(this.dbPath, destinationFile, {
      recursive: true,
    });
  }
}
