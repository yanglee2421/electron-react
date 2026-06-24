import type { NodeSQLiteDatabase } from "drizzle-orm/node-sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import url from "node:url";
import type { AppCradle } from "../types";
import { relations } from "./relations";
import * as schema from "./schema";

type DBClient = NodeSQLiteDatabase<typeof schema, typeof relations> & {
  $client: DatabaseSync;
};

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AppDB {
  client: DBClient;

  constructor({ DB_PATH }: AppCradle) {
    // const DB_PATH = path.resolve(app.getPath("userData"), "db.db");
    const client = new DatabaseSync(DB_PATH);
    this.client = drizzle({ client, relations, schema });
    migrate(this.client, {
      migrationsFolder: path.resolve(__dirname, "../../drizzle"),
    });
  }

  dispose() {
    this.client.$client.close();
  }
}
