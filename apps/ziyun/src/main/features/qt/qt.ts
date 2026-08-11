import type { ChannelImage } from "#main/workers/bmp";
import type { DBClient } from "@yanglee2421/external-db";
import { relations, schema } from "@yanglee2421/external-db";
import { createServer } from "@yanglee2421/hmis-proxy";
import dayjs from "dayjs";
import {
  and,
  between,
  eq,
  inArray,
  like,
  count as sqlCount,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";
import { app, shell } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Piscina } from "piscina";
import type { Observable, Subscription } from "rxjs";
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  EMPTY,
  last,
  NEVER,
  of,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  using,
} from "rxjs";
import workerPath from "../../workers/bmp?modulePath";
import type { Profile } from "../profile";
import type { AppCradle } from "../types";
import type {
  AnniversaryInput,
  Fetch502DateInput,
  FetchDetectionsInput,
  QTCHR53AInput,
  SetupAppInput,
  SetYiqiConfigLibInput,
} from "./types";

export class QT {
  readonly client$ = new BehaviorSubject<DBClient | null>(null);
  private db$: Observable<DBClient | null>;
  private hmis$: Observable<null>;
  private dbSubscription: Subscription;
  private hmisSubscription: Subscription;

  private profile: Profile;
  private piscina: Piscina;

  constructor({ profile }: AppCradle) {
    this.profile = profile;
    this.piscina = new Piscina({
      filename: workerPath,
      minThreads: 1,
      maxThreads: os.cpus().length,
    });

    this.db$ = this.profile.state$.pipe(
      distinctUntilChanged((p, c) => p.qtAppPath === c.qtAppPath),
      switchMap((s) => {
        if (!s.qtAppPath) {
          return of(null);
        }

        return using(
          () => {
            const flagFile = path.resolve(s.qtAppPath, "../FlagFile");
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
              takeUntil(this.profile.state$.pipe(last())),
            );
          },
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
      catchError((error) => {
        if (import.meta.env.DEV) {
          console.error(error);
        }

        return EMPTY;
      }),
    );

    this.hmis$ = this.profile.state$.pipe(
      distinctUntilChanged(
        (p, c) =>
          p.qtHMISEnabled === c.qtHMISEnabled && p.qtHMISPort === c.qtHMISPort,
      ),
      switchMap((state) => {
        if (!state.qtHMISEnabled) {
          return of(null);
        }

        return using(
          () => {
            const server = createServer(state.qtHMISPort);

            return {
              unsubscribe: () => {
                server.close();
              },
            };
          },
          () =>
            NEVER.pipe(
              startWith(null),
              takeUntil(this.profile.state$.pipe(last())),
            ),
        );
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );

    this.dbSubscription = this.db$.subscribe(this.client$);
    this.hmisSubscription = this.hmis$.subscribe();
  }

  async dispose() {
    this.client$.complete();
    this.piscina.destroy();
    this.dbSubscription.unsubscribe();
    this.hmisSubscription.unsubscribe();

    const tmpPath = path.resolve(app.getPath("temp"), app.getName());

    // Cleanup temporary files created by worker threads
    try {
      await fs.promises.rm(tmpPath, { recursive: true, force: true });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error);
      }
    }
  }

  get client() {
    const db = this.client$.value;

    if (db === null) {
      throw new Error("QT App database is not ready yet");
    }

    return db;
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
  async fetch502Data(input: Fetch502DateInput) {
    let ids: string[] = [];

    if (input.in.length > 0) {
      ids = input.in;
    } else {
      const rows = await this.client
        .select({ id: schema.quartors.szIds })
        .from(schema.quartors)
        .where(
          and(
            like(schema.quartors.szUsername, input.user),
            like(schema.quartors.szWhModel, input.zx),
            between(
              schema.quartors.tmNow,
              dayjs(input.date).startOf("day").toISOString(),
              dayjs(input.date).endOf("day").toISOString(),
            ),
          ),
        );

      ids = rows.map((r) => r.id).filter((r) => typeof r === "string");
    }

    const rows = await this.client
      .select()
      .from(schema.quartors)
      .where(inArray(schema.quartors.szIds, ids));

    const datas = await this.client
      .select()
      .from(schema.quartorsData)
      .where(inArray(schema.quartorsData.szIds, ids));

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
      datas,
      FACTORY_CLD: FACTORY_CLD?.value,
      FACTORY_SBXH: FACTORY_SBXH?.value,
      FACTORY_SBBH: FACTORY_SBBH?.value,
      FACTORY_SYRQ: FACTORY_SYRQ?.value,
    };
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
  async fetch52AData(szIds: string) {
    const [FACTORY_CLD] = await this.client
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_CLD"))
      .limit(1);

    const datas = await this.client
      .select()
      .from(schema.detectionsData)
      .where(eq(schema.detectionsData.szIds, szIds));

    return {
      FACTORY_CLD: FACTORY_CLD?.value,
      datas,
    };
  }
  async fetch53AData(input: QTCHR53AInput) {
    const rows = await this.client
      .select()
      .from(schema.detectors)
      .where(
        and(
          like(schema.detectors.szUsername, input.user),
          between(
            schema.detectors.tmNow,
            dayjs(input.date).startOf("day").toISOString(),
            dayjs(input.date).endOf("day").toISOString(),
          ),
        ),
      );

    return { rows };
  }

  async setupApp(params: SetupAppInput) {
    const { qtAppPath, qtDataDirectory } = params;

    this.dbSubscription.unsubscribe();

    await fs.promises.mkdir(qtDataDirectory, {
      recursive: true,
      mode: 0o666,
    });

    const flagFilePath = path.resolve(qtAppPath, "..", "FlagFile");
    const sourceDBPath = path.resolve(qtAppPath, "..", "local.db");
    const targetDBPath = path.resolve(qtDataDirectory, "./local.db");

    await fs.promises.cp(sourceDBPath, targetDBPath);
    await fs.promises.writeFile(flagFilePath, qtDataDirectory, {
      encoding: "utf8",
      flag: "w+",
      mode: 0o666,
    });

    this.dbSubscription = this.db$.subscribe(this.client$);
  }

  async getCurrentLocalDB() {
    const qtAppPath = this.profile.state.qtAppPath;
    const flagFilePath = path.resolve(qtAppPath, "..", "FlagFile");
    const flagFileContent = await fs.promises.readFile(flagFilePath, "utf8");
    const localDBPath = flagFileContent.trim();

    return localDBPath;
  }

  async deviceConfigList() {
    const rows = await this.client.select().from(schema.yqConfig);

    return { rows };
  }

  setDeviceConfigFlag(id: number) {
    return this.client.transaction((tx) => {
      tx.update(schema.yqConfig).set({ usedFlag: 0 }).run();
      return tx
        .update(schema.yqConfig)
        .set({ usedFlag: 1 })
        .where(eq(schema.yqConfig.recId, id))
        .returning()
        .get();
    });
  }

  async setDeviceConfigLib({ lib, id }: SetYiqiConfigLibInput) {
    const result = await this.client
      .update(schema.yqConfig)
      .set({ dllPath: lib })
      .where(eq(schema.yqConfig.recId, id))
      .returning();

    return result;
  }

  async startApp() {
    const result = await shell.openPath(this.profile.state.qtAppPath);

    return result;
  }

  async fetchDetections(input: FetchDetectionsInput) {
    const [{ count }] = await this.client
      .select({ count: sqlCount() })
      .from(schema.detectors)
      .where(
        between(
          schema.detectors.tmNow,
          dayjs(input.date).startOf("day").toISOString(),
          dayjs(input.date).endOf("day").toISOString(),
        ),
      );
    const rows = await this.client
      .select()
      .from(schema.detectors)
      .where(
        between(
          schema.detectors.tmNow,
          dayjs(input.date).startOf("day").toISOString(),
          dayjs(input.date).endOf("day").toISOString(),
        ),
      );

    return { count, rows };
  }
  async fetchVerifies() {
    const [{ count }] = await this.client
      .select({ count: sqlCount() })
      .from(schema.verifies);
    const rows = await this.client.select().from(schema.verifies);

    return { count, rows };
  }
  async fetchQuartors() {
    const [{ count }] = await this.client
      .select({ count: sqlCount() })
      .from(schema.quartors)
      .where(
        between(
          schema.quartors.tmNow,
          dayjs("2026-08-10").startOf("day").toISOString(),
          dayjs("2026-08-10").endOf("day").toISOString(),
        ),
      );
    const rows = await this.client
      .select()
      .from(schema.quartors)
      .where(
        between(
          schema.quartors.tmNow,
          dayjs("2026-08-10").startOf("day").toISOString(),
          dayjs("2026-08-10").endOf("day").toISOString(),
        ),
      );

    return { count, rows };
  }
  async anniversary(input: AnniversaryInput) {
    const { pageIndex, pageSize } = input;

    const [{ count }] = await this.client.select({ count: sqlCount() }).from(
      this.client
        .select({
          recId: schema.quartorRecordInfo.szIds,
          date: schema.quartorRecordInfo.tmNow,
        })
        .from(schema.quartorRecordInfo)
        .groupBy(schema.quartorRecordInfo.szIds)
        .as("groups"),
    );

    const rows = await this.client
      .select({
        recId: schema.quartorRecordInfo.szIds,
        date: schema.quartorRecordInfo.tmNow,
      })
      .from(schema.quartorRecordInfo)
      .groupBy(schema.quartorRecordInfo.szIds)
      .offset(pageIndex)
      .limit(pageSize);

    return { rows, count };
  }

  async anniversaryDetail(szIds: string) {
    const rows = await this.client
      .select()
      .from(schema.quartorRecordInfo)
      .where(eq(schema.quartorRecordInfo.szIds, szIds));

    return { rows };
  }
}