import type { ChannelImage } from "#main/workers/bmp";
import type { DBClient } from "@yanglee2421/external-db";
import { relations, schema } from "@yanglee2421/external-db";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";
import { app } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import Piscina from "piscina";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  defaultIfEmpty,
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
import workerPath from "../../workers/bmp?modulePath";
import type { Profile } from "../profile";
import type { AppCradle } from "../types";

export class ExternalDB {
  readonly client$ = new BehaviorSubject<DBClient | null>(null);
  private subscriptions: Subscription[];
  private profile: Profile;
  private piscina: Piscina;

  constructor({ profile }: AppCradle) {
    this.profile = profile;
    this.piscina = new Piscina({
      filename: workerPath,
      minThreads: 1,
      maxThreads: os.cpus().length,
    });

    const sub1 = profile.state$
      .pipe(
        distinctUntilChanged((previous, current) => {
          return previous.qtAppPath === current.qtAppPath;
        }),
        switchMap((state) => {
          if (!state.qtAppPath) {
            return EMPTY;
          }

          return using(
            () => {
              const flagFile = path.resolve(state.qtAppPath, "../FlagFile");
              const dataDirectory = fs.readFileSync(flagFile, "utf8").trim();
              const dbPath = path.resolve(dataDirectory, "./local.db");
              const client = new DatabaseSync(dbPath);
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
                takeUntil(profile.state$.pipe(last(), defaultIfEmpty(null))),
              );
            },
          );
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      )
      .subscribe(this.client$);

    this.subscriptions = [sub1];
  }

  dispose() {
    this.piscina.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
    const tmpPath = path.resolve(app.getPath("temp"), app.getName());

    // Cleanup temporary files created by worker threads
    if (fs.existsSync(tmpPath)) {
      fs.rmSync(tmpPath, { recursive: true, force: true });
    }
  }

  get client() {
    const db = this.client$.value;

    if (db === null) {
      throw new Error("External DB is not ready yet");
    }

    return db;
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
  async fetch501Data(id: string) {
    const [record] = await this.client
      .select()
      .from(schema.verifies)
      .where(eq(schema.verifies.szIds, id))
      .limit(1);

    if (!record) {
      throw new Error(`#${id}不存在`);
    }

    const flaws = await this.client
      .select()
      .from(schema.verifiesData)
      .where(eq(schema.verifiesData.precId, record.recId));

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

    const flagFile = path.resolve(this.profile.state.qtAppPath, "../FlagFile");
    const dataDirectory = fs.readFileSync(flagFile, "utf8").trim();
    const imageDirectory = path.resolve(dataDirectory, "./verifies", id);
    const lct = path.resolve(
      imageDirectory,
      `${record.szIds}.${record.szWhModel}.LCT.bmp`,
    );
    const llz = path.resolve(
      imageDirectory,
      `${record.szIds}.${record.szWhModel}.LLZ.bmp`,
    );
    const lxh = path.resolve(
      imageDirectory,
      `${record.szIds}.${record.szWhModel}.LXH.bmp`,
    );
    const rct = path.resolve(
      imageDirectory,
      `${record.szIds}.${record.szWhModel}.RCT.bmp`,
    );
    const rlz = path.resolve(
      imageDirectory,
      `${record.szIds}.${record.szWhModel}.RLZ.bmp`,
    );
    const rxh = path.resolve(
      imageDirectory,
      `${record.szIds}.${record.szWhModel}.RXH.bmp`,
    );
    const tmpPath = path.resolve(app.getPath("temp"), app.getName());

    await fs.promises.mkdir(tmpPath, { recursive: true });

    const jpegs: ChannelImage = await this.piscina.run({
      tmpPath,
      lct,
      rct,
      llz,
      rlz,
      lxh,
      rxh,
    });

    return {
      record,
      flaws,
      FACTORY_CLD: FACTORY_CLD?.value,
      FACTORY_SBXH: FACTORY_SBXH?.value,
      FACTORY_SBBH: FACTORY_SBBH?.value,
      FACTORY_SYRQ: FACTORY_SYRQ?.value,
      jpegs,
    };
  }
}