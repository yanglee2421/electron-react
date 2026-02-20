import Dexie from "dexie";
import type { EntityTable } from "dexie";

export type Log = {
  id: number;
  type: string;
  message: string;
  date: string;
};

export type Completion = {
  id: number;
  name: string;
};

export type MessageInAPI = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type MessageStatus = "pending" | "success" | "error" | "loading";

export type Message = {
  id: number;
  // Foreign key to the Completion table
  completionId: number;
  question: string;
  questionDate: string;
  messages: MessageInAPI[];
  answer: string;
  answerDate: null | string;
  status: MessageStatus;
  thumb: "up" | "down" | null;
};

export const db = new Dexie("ChatDatabase") as Dexie & {
  log: EntityTable<Log, "id">;
  completions: EntityTable<Completion, "id">;
  messages: EntityTable<Message, "id">;
};

// Schema declaration:
db.version(1).stores({
  log: "++id, type, message, date",
  completions: "++id, name", // primary key "id" automatically generated
  messages:
    "++id, completionId, question, questionDate, answer, answerDate, status, thumb",
});
