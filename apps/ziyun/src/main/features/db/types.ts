import type { NodeSQLiteDatabase } from "drizzle-orm/node-sqlite";
import type { DatabaseSync } from "node:sqlite";
import type { relations } from "./relations";
import type * as schema from "./schema";

export type DBClient = NodeSQLiteDatabase<typeof schema, typeof relations> & {
  $client: DatabaseSync;
};

export interface IPCContract {
  "DB/EXPORT": {
    args: [];
    return: void;
  };
}

export type GuangzhoucheliangBarcode =
  typeof schema.guangzhoucheliangBarcodeTable.$inferSelect;