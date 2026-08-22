import type { NodeSQLiteDatabase } from "drizzle-orm/node-sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AppCradle } from "../types";
import { relations } from "./relations";
import * as schema from "./schema";

type DBClient = NodeSQLiteDatabase<typeof schema, typeof relations> & {
  $client: DatabaseSync;
};

export class AppDB {
  client: DBClient;

  constructor({ DB_PATH }: AppCradle) {
    const client = new DatabaseSync(DB_PATH);
    const migrationsFolder = path.resolve(__dirname, "../../drizzle");

    this.client = drizzle({ client, relations, schema });
    migrate(this.client, { migrationsFolder });
  }

  dispose() {
    this.client.$client.close();
  }
}
