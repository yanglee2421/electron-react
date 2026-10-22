import type { KV } from "#main/features/kv";
import { BehaviorSubject, map } from "rxjs";
import type { z } from "zod";

const safeJsonParse = (storage: string | null | undefined) => {
  if (!storage) {
    return {};
  }

  try {
    return JSON.parse(storage).state;
  } catch {
    return {};
  }
};

export const hydrateSubject = <T extends z.ZodType>(
  kv: KV,
  key: string,
  schema: T,
) => {
  const storage = kv.getItem(key);
  const initialState = schema.parse(safeJsonParse(storage));
  const state$ = new BehaviorSubject(initialState);
  const subscription = kv
    .when()
    .pipe(
      map((e) => {
        switch (e.action) {
          case "set":
            return schema.parse(safeJsonParse(e.value));
          case "remove":
          case "clear":
            return schema.parse({});
        }
      }),
    )
    .subscribe(state$);

  return [state$, subscription] as const;
};
