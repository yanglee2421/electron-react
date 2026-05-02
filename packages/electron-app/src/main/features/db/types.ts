import type { Database } from "better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { relations } from "./relations";
import type * as schema from "./schema";

export type DBClient = BetterSQLite3Database<
  typeof schema,
  typeof relations
> & {
  $client: Database;
};

export interface IPCContract {
  "DB/EXPORT": {
    args: [];
    return: void;
  };
}
