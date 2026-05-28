import { drizzle } from "drizzle-orm/node-sqlite";
import type { DBClient } from "external-db";
import { relations, schema } from "external-db";
import { DatabaseSync } from "node:sqlite";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  distinctUntilChanged,
  last,
  NEVER,
  of,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  using,
} from "rxjs";
import type { AppCradle } from "../types";

export class ExternalDB {
  readonly client$ = new BehaviorSubject<DBClient | null>(null);
  private subscription: Subscription;

  constructor({ profile }: AppCradle) {
    this.subscription = profile.state$
      .pipe(
        distinctUntilChanged((previous, current) => {
          return (
            previous.enableExternalDB === current.enableExternalDB &&
            previous.externalDBPath === current.externalDBPath
          );
        }),
        switchMap((profile) => {
          if (!profile.enableExternalDB) {
            return of(null);
          }

          return using(
            () => {
              const client = new DatabaseSync(profile.externalDBPath);
              const db = drizzle({ client, schema, relations });

              return {
                unsubscribe: () => {
                  db.$client.close();
                },
                db,
              };
            },
            (c) => {
              const db: DBClient = Reflect.get(Object(c), "db");

              return NEVER.pipe(startWith(db));
            },
          );
        }),
        takeUntil(profile.state$.pipe(last())),
        shareReplay({ bufferSize: 1, refCount: true }),
      )
      .subscribe(this.client$);
  }

  dispose() {
    this.subscription.unsubscribe();
  }

  get client() {
    const db = this.client$.value;

    if (db === null) {
      throw new Error("External DB is not ready yet");
    }

    return db;
  }

  async test() {
    const rows = await this.client.select().from(schema.yqConfig);

    return rows;
  }
}
