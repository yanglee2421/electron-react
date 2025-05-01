import Dexie, { type EntityTable } from "dexie";

export type Log = {
  id: number;
  type: string;
  message: string;
  date: string;
};

export const db = new Dexie("ChatDatabase") as Dexie & {
  log: EntityTable<Log, "id">;
};

// Schema declaration:
db.version(1).stores({
  log: "++id, type, message, date",
});
