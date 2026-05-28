import type { NodeSQLiteDatabase } from "drizzle-orm/node-sqlite";
import type { DatabaseSync } from "node:sqlite";
import { relations } from "./relations";
import * as schema from "./schema";

export { relations, schema };

export type DBClient = NodeSQLiteDatabase<typeof schema, typeof relations> & {
  $client: DatabaseSync;
};
