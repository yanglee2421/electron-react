import type { ChannelImage } from "#main/workers/bmp";
import type { DBClient } from "@yanglee2421/external-db";
import { relations, schema } from "@yanglee2421/external-db";
import { createServer } from "@yanglee2421/hmis-proxy";
import dayjs from "dayjs";
import {
  and,
  asc,
  between,
  desc,
  eq,
  inArray,
  like,
  lt,
  ne,
  count as sqlCount,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";
import { app, shell } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Piscina } from "piscina";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  catchError,
  defer,
  distinctUntilChanged,
  EMPTY,
  Observable,
  of,
  shareReplay,
  switchMap,
} from "rxjs";
import workerPath from "../../workers/bmp?modulePath";
import type { Logger } from "../logger";
import type { Profile } from "../profile";
import type { AppCradle } from "../types";
import type {
  AnniversaryInput,
  Fetch502DateInput,
  FetchDetectionsInput,
  FetchQTVerifiesInput,
  FetchQuartorsInput,
  QTCHR53AInput,
  SetQTConfigInput,
  SetupAppInput,
  SetYiqiConfigLibInput,
  UpsertUserInput,
} from "./types";

export class QT {
  readonly client$ = new BehaviorSubject<DBClient | null>(null);
  private db$: Observable<DBClient | null>;
  private hmis$: Observable<null>;
  private dbSubscription: Subscription;
  private hmisSubscription: Subscription;

  private piscina: Piscina;
  private profile: Profile;
  private logger: Logger;

  constructor({ profile, logger }: AppCradle) {
    this.profile = profile;
    this.logger = logger;
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

        return defer(() => {
          const flagFile = path.resolve(s.qtAppPath, "../FlagFile");
          const dataDirectory = fs.readFileSync(flagFile, "utf8").trim();
          const dbPath = path.resolve(dataDirectory, "./local.db");
          const client = new DatabaseSync(dbPath);
          const db = drizzle({ client, schema, relations });

          return new Observable<DBClient>((sub) => {
            sub.next(db);

            return () => {
              db.$client.close();
            };
          });
        }).pipe(
          catchError((error) => {
            if (import.meta.env.DEV) {
              console.error(error);
            }

            if (error instanceof Error) {
              this.logger.error({
                title: error.message,
                message: error.stack,
              });
            }

            return EMPTY;
          }),
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
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

        return defer(() => {
          const server = createServer(state.qtHMISPort);

          return new Observable<null>((sub) => {
            server.on("error", (error) => {
              sub.error(error);
            });

            server.on("open", () => {
              sub.next(null);
            });

            server.on("close", () => {
              sub.complete();
            });

            return () => {
              server.close();
            };
          }).pipe(
            catchError((error) => {
              if (import.meta.env.DEV) {
                console.error(error);
              }

              if (error instanceof Error) {
                this.logger.error({
                  title: error.message,
                  message: error.stack,
                });
              }

              return EMPTY;
            }),
          );
        });
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
    const { date, user, zx, ids } = input;

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

    if (ids.length > 0) {
      const idList = ids.map((i) => Number.parseInt(i));

      const rows = await this.client
        .select()
        .from(schema.quartors)
        .where(inArray(schema.quartors.recId, idList))
        .orderBy(asc(schema.quartors.tmNow));

      if (rows.length !== 5) {
        throw new Error(`CHR502需要5条数据; 当前${rows.length}条`);
      }

      const datas = await this.client
        .select()
        .from(schema.quartorsData)
        .where(inArray(schema.quartorsData.precId, idList));

      const firstRow = rows.at(0);
      let previousRow = null;

      if (firstRow) {
        [previousRow] = await this.client
          .select()
          .from(schema.quartors)
          .where(
            and(
              eq(schema.quartors.szWhModel, firstRow.szWhModel || ""),
              lt(schema.quartors.tmNow, firstRow.tmNow || ""),
            ),
          )
          .orderBy(desc(schema.quartors.tmNow))
          .limit(1);
      }

      return {
        previousRow,
        rows,
        datas,
        FACTORY_CLD: FACTORY_CLD?.value,
        FACTORY_SBXH: FACTORY_SBXH?.value,
        FACTORY_SBBH: FACTORY_SBBH?.value,
        FACTORY_SYRQ: FACTORY_SYRQ?.value,
      };
    }

    const day = dayjs(date);
    const rows = await this.client
      .select()
      .from(schema.quartors)
      .where(
        and(
          between(
            schema.quartors.tmNow,
            day.startOf("day").toISOString(),
            day.endOf("day").toISOString(),
          ),
          like(schema.quartors.szUsername, `%${user}%`),
          like(schema.quartors.szWhModel, `%${zx}%`),
        ),
      );

    if (rows.length !== 5) {
      throw new Error(`CHR502需要5条数据; 当前${rows.length}条`);
    }

    const datas = await this.client
      .select()
      .from(schema.quartorsData)
      .where(
        inArray(
          schema.quartorsData.recId,
          rows.map((r) => r.recId),
        ),
      );

    const firstRow = rows.at(0);
    let previousRow = null;

    if (firstRow) {
      [previousRow] = await this.client
        .select()
        .from(schema.quartors)
        .where(
          and(
            eq(schema.quartors.szWhModel, firstRow.szWhModel || ""),
            lt(schema.quartors.tmNow, firstRow.tmNow || ""),
          ),
        )
        .orderBy(desc(schema.quartors.tmNow))
        .limit(1);
    }

    return {
      previousRow,
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

    const [record] = await this.client
      .select()
      .from(schema.detectors)
      .where(eq(schema.detectors.szIds, szIds));

    const flagFile = path.resolve(this.profile.state.qtAppPath, "../FlagFile");
    const dataDirectory = fs.readFileSync(flagFile, "utf8").trim();
    const imageDirectory = path.resolve(dataDirectory, "./detectors", szIds);
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
      FACTORY_CLD: FACTORY_CLD?.value,
      datas,
      record,
      jpegs,
    };
  }
  async fetch53AData(input: QTCHR53AInput) {
    const { date, user, ids } = input;

    const [FACTORY_CLD] = await this.client
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_CLD"))
      .limit(1);

    if (ids.length) {
      const idList = ids.map((i) => Number.parseInt(i));

      const rows = await this.client
        .select()
        .from(schema.detectors)
        .where(inArray(schema.detectors.recId, idList));

      return {
        rows,
        FACTORY_CLD: FACTORY_CLD?.value,
      };
    }

    const day = dayjs(date);
    const rows = await this.client
      .select()
      .from(schema.detectors)
      .where(
        and(
          between(
            schema.detectors.tmNow,
            day.startOf("day").toISOString(),
            day.endOf("day").toISOString(),
          ),
          like(schema.detectors.szUsername, `%${user}%`),
        ),
      );

    return {
      rows,
      FACTORY_CLD: FACTORY_CLD?.value,
    };
  }

  async setupApp(params: SetupAppInput) {
    const { qtAppPath, qtDataDirectory } = params;

    try {
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
    } finally {
      this.dbSubscription = this.db$.subscribe(this.client$);
    }
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
    const { date, user, zx, zh, result, pageIndex, pageSize } = input;

    const day = date ? dayjs(date) : null;
    const sqlCommand = this.client
      .select()
      .from(schema.detectors)
      .where(
        and(
          ne(schema.detectors.bIsEnable, 0),
          day
            ? between(
                schema.detectors.tmNow,
                day.startOf("day").toISOString(),
                day.endOf("day").toISOString(),
              )
            : void 0,
          user ? like(schema.detectors.szUsername, `%${user}%`) : void 0,
          zx ? like(schema.detectors.szWhModel, `%${zx}%`) : void 0,
          zh ? like(schema.detectors.szZh, `%${zh}%`) : void 0,
          result ? like(schema.detectors.szResult, `%${result}%`) : void 0,
        ),
      )
      .orderBy(desc(schema.detectors.tmNow));

    const [{ count }] = await this.client
      .select({ count: sqlCount() })
      .from(sqlCommand.as("rows"));

    const rows = await sqlCommand.offset(pageIndex * pageSize).limit(pageSize);

    return { count, rows };
  }
  async fetchVerifies(input: FetchQTVerifiesInput) {
    const { pageIndex, pageSize, user, zx, date } = input;

    const day = date ? dayjs(date) : null;
    const sqlCommand = this.client
      .select()
      .from(schema.verifies)
      .where(
        and(
          ne(schema.verifies.bIsEnable, 0),
          day
            ? between(
                schema.verifies.tmNow,
                day.startOf("day").toISOString(),
                day.endOf("day").toISOString(),
              )
            : void 0,
          user ? like(schema.verifies.szUsername, `%${user}%`) : void 0,
          zx ? like(schema.verifies.szWhModel, `%${zx}%`) : void 0,
        ),
      )
      .orderBy(desc(schema.verifies.tmNow));

    const [{ count }] = await this.client
      .select({ count: sqlCount() })
      .from(sqlCommand.as("rows"));

    const rows = await sqlCommand.offset(pageIndex * pageSize).limit(pageSize);

    return { count, rows };
  }
  async fetchQuartors(input: FetchQuartorsInput) {
    const { user, date, zx, pageIndex = 0, pageSize = 20 } = input;

    const day = date ? dayjs(date) : null;
    const sqlCommand = this.client
      .select()
      .from(schema.quartors)
      .where(
        and(
          ne(schema.quartors.bIsEnable, 0),
          day
            ? between(
                schema.quartors.tmNow,
                day.startOf("day").toISOString(),
                day.endOf("day").toISOString(),
              )
            : void 0,
          user ? like(schema.quartors.szUsername, `%${user}%`) : void 0,
          zx ? like(schema.quartors.szWhModel, `%${zx}%`) : void 0,
        ),
      )
      .orderBy(desc(schema.quartors.tmNow));

    const [{ count }] = await this.client
      .select({ count: sqlCount() })
      .from(sqlCommand.as("rows"));

    const rows = await sqlCommand.offset(pageIndex * pageSize).limit(pageSize);

    return { count, rows };
  }
  async anniversary(input: AnniversaryInput) {
    const { pageIndex, pageSize } = input;

    const sqlCommand = this.client
      .select({
        recId: schema.quartorRecordInfo.szIds,
        date: schema.quartorRecordInfo.tmNow,
      })
      .from(schema.quartorRecordInfo)
      .groupBy(schema.quartorRecordInfo.szIds)
      .orderBy(desc(schema.quartorRecordInfo.tmNow));

    const [{ count }] = await this.client
      .select({ count: sqlCount() })
      .from(sqlCommand.as("groups"));

    const rows = await sqlCommand.offset(pageIndex * pageSize).limit(pageSize);

    return { rows, count };
  }

  async anniversaryDetail(szIds: string) {
    const rows = await this.client
      .select()
      .from(schema.quartorRecordInfo)
      .where(eq(schema.quartorRecordInfo.szIds, szIds));

    return { rows };
  }

  async fetchUsers() {
    const rows = await this.client
      .select({
        recId: schema.userManager.recId,
        userName: schema.userManager.userName,
        name: schema.userManager.name,
        power: schema.userManager.power,
        regTime: schema.userManager.regTime,
      })
      .from(schema.userManager);

    return { rows };
  }
  async upsertUsers(input: UpsertUserInput) {
    const { name, recId, pwd, power } = input;

    const rows = await this.client
      .insert(schema.userManager)
      .values({
        recId,
        name,
        userName: name,
        pwd,
        power,
        regTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      })
      .onConflictDoUpdate({
        target: schema.userManager.recId,
        set: {},
      })
      .returning();

    return { rows };
  }
  async deleteUsers(id: number) {
    const row = await this.client
      .delete(schema.userManager)
      .where(eq(schema.userManager.recId, id))
      .returning();

    return { row };
  }
  async getConfig() {
    const rows = await this.client
      .select({
        id: schema.sysConfig.recId,
        key: schema.sysConfig.configKey,
        value: schema.sysConfig.configValue,
        description: schema.sysConfig.remark,
        readOnly: schema.sysConfig.isReadOnly,
      })
      .from(schema.sysConfig)
      .where(and(ne(schema.sysConfig.configKey, "")));

    return { rows };
  }
  setConfig(input: SetQTConfigInput) {
    const result = this.client.transaction((tx) => {
      return input.values.map(({ key, value }) => {
        return tx
          .insert(schema.sysConfig)
          .values({
            configKey: key,
            configValue: value,
          })
          .onConflictDoUpdate({
            target: schema.sysConfig.configKey,
            set: { configValue: value },
          })
          .returning()
          .get();
      });
    });

    return { result };
  }
}
