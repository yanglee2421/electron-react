import type { NodeSQLiteDatabase } from "drizzle-orm/node-sqlite";
import type { DatabaseSync } from "node:sqlite";
import { relations } from "./relations.ts";
import * as schema from "./schema.ts";

export { relations, schema };

export type DBClient = NodeSQLiteDatabase<typeof relations> & {
  $client: DatabaseSync;
};
