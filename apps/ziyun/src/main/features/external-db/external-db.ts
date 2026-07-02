import type { DBClient } from "@yanglee2421/external-db";
import { relations, schema } from "@yanglee2421/external-db";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";
import { DatabaseSync } from "node:sqlite";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  distinctUntilChanged,
  EMPTY,
  last,
  NEVER,
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
        switchMap((state) => {
          if (!state.enableExternalDB) {
            return EMPTY;
          }

          return using(
            () => {
              const client = new DatabaseSync(state.externalDBPath);
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

              return NEVER.pipe(
                startWith(db),
                takeUntil(profile.state$.pipe(last())),
              );
            },
          );
        }),
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

  async anniversary() {
    const rows = await this.client
      .selectDistinct({ recId: schema.quartorRecordInfo.szIds })
      .from(schema.quartorRecordInfo);

    return { rows };
  }

  async anniversaryDetail(szIds: string) {
    const rows = await this.client
      .select()
      .from(schema.quartorRecordInfo)
      .where(eq(schema.quartorRecordInfo.szIds, szIds));

    return { rows };
  }

  async fetch503Data(szIds: string) {
    const rows = await this.client
      .select()
      .from(schema.quartorRecordInfo)
      .where(eq(schema.quartorRecordInfo.szIds, szIds));

    const [FACTORY_CLD] = await this.client
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_CLD"))
      .limit(1);

    const [FACTORY_SBXH] = await this.client
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SBXH"))
      .limit(1);

    const [FACTORY_SBBH] = await this.client
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SBBH"))
      .limit(1);

    const [FACTORY_SYRQ] = await this.client
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SYRQ"))
      .limit(1);

    return {
      rows,
      FACTORY_CLD: FACTORY_CLD?.value,
      FACTORY_SBXH: FACTORY_SBXH?.value,
      FACTORY_SBBH: FACTORY_SBBH?.value,
      FACTORY_SYRQ: FACTORY_SYRQ?.value,
    };
  }
}
