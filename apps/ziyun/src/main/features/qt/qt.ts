import type { ChannelImage } from "#main/workers/bmp";
import { platform } from "@electron-toolkit/utils";
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
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import { app } from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import url from "node:url";
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
  SetYiqiConfigLibInput,
  UpsertUserInput,
} from "./types";

export class QT {
  readonly db$ = new BehaviorSubject<DBClient | null>(null);
  private dbFlow$: Observable<DBClient | null>;
  private hmisFlow$: Observable<null>;
  private dbSubscription: Subscription;
  private hmisSubscription: Subscription;

  private qtProcess: ChildProcessWithoutNullStreams | null = null;

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

    this.dbFlow$ = this.profile.state$.pipe(
      distinctUntilChanged((p, c) => p.qtAppPath === c.qtAppPath),
      switchMap((s) => {
        if (!s.qtAppPath) {
          return of(null);
        }

        const flagPath = this.readFlagPath();
        const dbPath = flagPath.localDB;

        if (!dbPath) {
          return of(null);
        }

        return defer(() => {
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

    this.hmisFlow$ = this.profile.state$.pipe(
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

    this.dbSubscription = this.dbFlow$.subscribe(this.db$);
    this.hmisSubscription = this.hmisFlow$.subscribe();
  }

  async dispose() {
    this.db$.complete();
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

  get db() {
    const db = this.db$.value;

    if (db === null) {
      throw new Error("QT App database is not ready yet");
    }

    return db;
  }

  get appPath() {
    const appPath = this.profile.state.qtAppPath;

    if (!appPath) {
      throw Error("必须先指定QT APP的工作目录");
    }

    return appPath;
  }

  readFlagPath() {
    const flagFile = path.resolve(this.appPath, "../FlagFile");
    const dataDirectory = fs.readFileSync(flagFile, "utf8").trim();
    const localDB = path.resolve(dataDirectory, "./local.db");
    const appDB = path.resolve(this.appPath, "../local.db");

    return {
      flagFile,
      dataDirectory,
      localDB,
      appDB,
    };
  }

  async fetch501Data(id: string) {
    const [record] = await this.db
      .select()
      .from(schema.verifies)
      .where(eq(schema.verifies.szIds, id))
      .limit(1);

    if (!record) {
      throw new Error(`#${id}不存在`);
    }

    const flaws = await this.db
      .select()
      .from(schema.verifiesData)
      .where(eq(schema.verifiesData.precId, record.recId));

    const [FACTORY_CLD] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_CLD"))
      .limit(1);

    const [FACTORY_SBXH] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SBXH"))
      .limit(1);

    const [FACTORY_SBBH] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SBBH"))
      .limit(1);

    const [FACTORY_SYRQ] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SYRQ"))
      .limit(1);

    const flagPath = this.readFlagPath();
    const imageDirectory = path.resolve(
      flagPath.dataDirectory,
      "./verifies",
      id,
    );
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

    const [FACTORY_CLD] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_CLD"))
      .limit(1);

    const [FACTORY_SBXH] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SBXH"))
      .limit(1);

    const [FACTORY_SBBH] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SBBH"))
      .limit(1);

    const [FACTORY_SYRQ] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SYRQ"))
      .limit(1);

    if (ids.length > 0) {
      const idList = ids.map((i) => Number.parseInt(i));

      const rows = await this.db
        .select()
        .from(schema.quartors)
        .where(inArray(schema.quartors.recId, idList))
        .orderBy(asc(schema.quartors.tmNow));

      if (rows.length !== 5) {
        throw new Error(`CHR502需要5条数据; 当前${rows.length}条`);
      }

      const datas = await this.db
        .select()
        .from(schema.quartorsData)
        .where(inArray(schema.quartorsData.precId, idList));

      const firstRow = rows.at(0);
      let previousRow = null;

      if (firstRow) {
        [previousRow] = await this.db
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
    const rows = await this.db
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

    const datas = await this.db
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
      [previousRow] = await this.db
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
    const rows = await this.db
      .select()
      .from(schema.quartorRecordInfo)
      .where(eq(schema.quartorRecordInfo.szIds, szIds));

    const [FACTORY_CLD] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_CLD"))
      .limit(1);

    const [FACTORY_SBXH] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SBXH"))
      .limit(1);

    const [FACTORY_SBBH] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_SBBH"))
      .limit(1);

    const [FACTORY_SYRQ] = await this.db
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
    const [FACTORY_CLD] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_CLD"))
      .limit(1);

    const datas = await this.db
      .select()
      .from(schema.detectionsData)
      .where(eq(schema.detectionsData.szIds, szIds));

    const [record] = await this.db
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

    const [FACTORY_CLD] = await this.db
      .select({ value: schema.sysConfig.configValue })
      .from(schema.sysConfig)
      .where(eq(schema.sysConfig.configKey, "FACTORY_CLD"))
      .limit(1);

    if (ids.length) {
      const idList = ids.map((i) => Number.parseInt(i));

      const rows = await this.db
        .select()
        .from(schema.detectors)
        .where(inArray(schema.detectors.recId, idList));

      return {
        rows,
        FACTORY_CLD: FACTORY_CLD?.value,
      };
    }

    const day = dayjs(date);
    const rows = await this.db
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

  async startApp() {
    const appPath = this.profile.state.qtAppPath;
    const cwd = path.dirname(appPath);

    if (platform.isLinux) {
      this.qtProcess = spawn(appPath, [], {
        cwd,
        env: {
          ...process.env,
          QT_PLUGIN_PATH: "plugins",
          LD_LIBRARY_PATH: `lib:${process.env.LD_LIBRARY_PATH || ""}`,
        },
      });

      this.qtProcess.once("close", () => {
        this.qtProcess = null;
      });
    } else {
      this.qtProcess = spawn(appPath, [], {
        cwd,
      });

      this.qtProcess.once("close", () => {
        this.qtProcess = null;
      });
    }

    return this.qtProcess?.pid;
  }
  async stopApp() {
    this.qtProcess?.kill();
  }
  migrateDB(sourcePath: string, targetPath: string) {
    if (sourcePath === targetPath) {
      throw Error("目标路径与源路径完全一致");
    }

    const sourceDB = drizzle({
      client: new DatabaseSync(sourcePath),
      schema,
      relations,
    });
    const targetDB = drizzle({
      client: new DatabaseSync(targetPath),
      schema,
      relations,
    });
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    migrate(targetDB, {
      migrationsFolder: path.resolve(__dirname, "../../drizzle/qt"),
    });

    targetDB.transaction((tx) => {
      const alxInfos = sourceDB.select().from(schema.alxInfo).all();
      tx.insert(schema.alxInfo).values(alxInfos).run();
      const channels = sourceDB.select().from(schema.channels).all();
      tx.insert(schema.channels).values(channels).run();
      const gates = sourceDB.select().from(schema.gates).all();
      tx.insert(schema.gates).values(gates).run();
      const quartorChannels = sourceDB
        .select()
        .from(schema.quartorChannel)
        .all();
      tx.insert(schema.quartorChannel).values(quartorChannels).run();
      const quartorGates = sourceDB.select().from(schema.quartorGates).all();
      tx.insert(schema.quartorGates).values(quartorGates).run();
      const quartorRecordInfos = sourceDB
        .select()
        .from(schema.quartorRecordInfo)
        .all();
      tx.insert(schema.quartorRecordInfo).values(quartorRecordInfos).run();
      const sysConfigs = sourceDB.select().from(schema.sysConfig).all();
      tx.insert(schema.sysConfig).values(sysConfigs).run();
      const users = sourceDB.select().from(schema.userManager).all();
      tx.insert(schema.userManager).values(users).run();
      const yqConfigs = sourceDB.select().from(schema.yqConfig).all();
      tx.insert(schema.yqConfig).values(yqConfigs).run();
    });

    sourceDB.$client.close();
    targetDB.$client.close();

    return { running: calcRunning(this.qtProcess) };
  }

  getFlagFile() {
    const flagPath = this.readFlagPath();

    return flagPath.dataDirectory;
  }
  async setFlagFile(qtDataDirectory: string) {
    const targetDB = path.resolve(qtDataDirectory, "./local.db");

    if (fs.existsSync(targetDB)) {
      throw new Error("目录路径数据库已存在");
    }

    await fs.promises.mkdir(path.dirname(targetDB), {
      recursive: true,
      mode: 0o666,
    });

    const flagPath = this.readFlagPath();
    const sourceDB = fs.existsSync(flagPath.localDB)
      ? flagPath.localDB
      : flagPath.appDB;

    this.migrateDB(sourceDB, targetDB);

    try {
      await fs.promises.writeFile(flagPath.flagFile, qtDataDirectory, {
        encoding: "utf8",
        flag: "w",
        mode: 0o666,
      });
    } finally {
      this.dbSubscription.unsubscribe();
      this.dbSubscription = this.dbFlow$.subscribe(this.db$);
    }

    return { running: calcRunning(this.qtProcess) };
  }

  async deviceConfigList() {
    const rows = await this.db.select().from(schema.yqConfig);

    return { rows };
  }

  setDeviceConfigFlag(id: number) {
    const result = this.db.transaction((tx) => {
      tx.update(schema.yqConfig).set({ usedFlag: 0 }).run();
      return tx
        .update(schema.yqConfig)
        .set({ usedFlag: 1 })
        .where(eq(schema.yqConfig.recId, id))
        .returning()
        .get();
    });

    return { result, running: calcRunning(this.qtProcess) };
  }

  async setDeviceConfigLib({ lib, id }: SetYiqiConfigLibInput) {
    const result = await this.db
      .update(schema.yqConfig)
      .set({ dllPath: lib })
      .where(eq(schema.yqConfig.recId, id))
      .returning();

    return { result, running: calcRunning(this.qtProcess) };
  }

  async fetchDetections(input: FetchDetectionsInput) {
    const { date, user, zx, zh, result, pageIndex, pageSize } = input;

    const day = date ? dayjs(date) : null;
    const sqlCommand = this.db
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

    const [{ count }] = await this.db
      .select({ count: sqlCount() })
      .from(sqlCommand.as("rows"));

    const rows = await sqlCommand.offset(pageIndex * pageSize).limit(pageSize);

    return { count, rows };
  }
  async fetchVerifies(input: FetchQTVerifiesInput) {
    const { pageIndex, pageSize, user, zx, date } = input;

    const day = date ? dayjs(date) : null;
    const sqlCommand = this.db
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

    const [{ count }] = await this.db
      .select({ count: sqlCount() })
      .from(sqlCommand.as("rows"));

    const rows = await sqlCommand.offset(pageIndex * pageSize).limit(pageSize);

    return { count, rows };
  }
  async fetchQuartors(input: FetchQuartorsInput) {
    const { user, date, zx, pageIndex = 0, pageSize = 20 } = input;

    const day = date ? dayjs(date) : null;
    const sqlCommand = this.db
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

    const [{ count }] = await this.db
      .select({ count: sqlCount() })
      .from(sqlCommand.as("rows"));

    const rows = await sqlCommand.offset(pageIndex * pageSize).limit(pageSize);

    return { count, rows };
  }
  async anniversary(input: AnniversaryInput) {
    const { pageIndex, pageSize } = input;

    const sqlCommand = this.db
      .select({
        recId: schema.quartorRecordInfo.szIds,
        date: schema.quartorRecordInfo.tmNow,
      })
      .from(schema.quartorRecordInfo)
      .groupBy(schema.quartorRecordInfo.szIds)
      .orderBy(desc(schema.quartorRecordInfo.tmNow));

    const [{ count }] = await this.db
      .select({ count: sqlCount() })
      .from(sqlCommand.as("groups"));

    const rows = await sqlCommand.offset(pageIndex * pageSize).limit(pageSize);

    return { rows, count };
  }

  async anniversaryDetail(szIds: string) {
    const rows = await this.db
      .select()
      .from(schema.quartorRecordInfo)
      .where(eq(schema.quartorRecordInfo.szIds, szIds));

    return { rows };
  }

  async fetchUsers() {
    const rows = await this.db
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

    const rows = await this.db
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
        set: { name, pwd, power },
      })
      .returning();

    return { rows, running: calcRunning(this.qtProcess) };
  }
  async deleteUsers(id: number) {
    const row = await this.db
      .delete(schema.userManager)
      .where(eq(schema.userManager.recId, id))
      .returning();

    return { row, running: calcRunning(this.qtProcess) };
  }
  async getConfig() {
    const rows = await this.db
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
    const result = this.db.transaction((tx) => {
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

    return { result, running: calcRunning(this.qtProcess) };
  }
}

const calcRunning = (cp: ChildProcessWithoutNullStreams | null) => {
  if (!cp) {
    return false;
  }

  return !cp.killed;
};
