import type { ChannelImage } from "#main/workers/bmp";
import { platform } from "@electron-toolkit/utils";
import type { DBClient } from "@yanglee2421/external-db";
import { relations, schema } from "@yanglee2421/external-db";
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
  sql,
  count as sqlCount,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-sqlite";
import { app } from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Piscina } from "piscina";
import type { Subscription } from "rxjs";
import {
  BehaviorSubject,
  catchError,
  distinctUntilChanged,
  EMPTY,
  endWith,
  exhaustMap,
  Observable,
  of,
  retry,
  shareReplay,
  Subject,
  switchMap,
} from "rxjs";
import workerPath from "../../workers/bmp?modulePath";
import type { Logger } from "../logger";
import type { Profile } from "../profile";
import type { AppCradle } from "../types";
import { createServer } from "./hmis";
import type {
  AnniversaryInput,
  Fetch502DateInput,
  FetchDetectionsInput,
  FetchQTVerifiesInput,
  FetchQuartorsInput,
  QTCHR53AInput,
  QTMigrateDBInput,
  SetQTConfigInput,
  SetYiqiConfigLibInput,
  UpsertUserInput,
} from "./types";

export class QT {
  readonly db$ = new BehaviorSubject<DBClient | null>(null);
  private dbFlow$: Observable<DBClient | null>;
  private hmisFlow$: Observable<null>;
  private qtProcess$ =
    new BehaviorSubject<ChildProcessWithoutNullStreams | null>(null);
  private qtProcessFlow$: Observable<ChildProcessWithoutNullStreams | null>;
  private dbSubscription: Subscription;
  private hmisSubscription: Subscription;
  private qtProcessSubscription: Subscription;
  private qtProcessTrigger$ = new Subject();

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

        const dbPath = this.getLocalDBPath();

        if (!dbPath) {
          return of(null);
        }

        return new Observable<DBClient>((sub) => {
          const client = new DatabaseSync(dbPath);
          const db = drizzle({ client, schema, relations });
          sub.next(db);

          return () => {
            db.$client.close();
          };
        }).pipe(
          catchError((error) => {
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

        return new Observable<null>((sub) => {
          const server = createServer(state.qtHMISPort);

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
      shareReplay({ refCount: true, bufferSize: 1 }),
    );

    this.qtProcessFlow$ = this.qtProcessTrigger$.pipe(
      exhaustMap(() => {
        return new Observable<ChildProcessWithoutNullStreams | null>((sub) => {
          const appPath = this.profile.state.qtAppPath;
          const cwd = path.dirname(appPath);
          const cp = spawn(appPath, [], {
            cwd,
            env: platform.isLinux
              ? {
                  ...process.env,
                  QT_PLUGIN_PATH: "plugins",
                  LD_LIBRARY_PATH: `lib:${process.env.LD_LIBRARY_PATH || ""}`,
                }
              : void 0,
          });

          cp.on("error", (error) => {
            sub.error(error);
          });

          cp.on("spawn", () => {
            sub.next(cp);
          });

          cp.on("exit", () => {
            sub.complete();
          });

          cp.stderr.on("data", (data) => {
            const msg = String(data);

            if (msg.includes("该实例已在运行")) {
              sub.error(new Error(msg));
            }
          });

          return () => {
            cp.kill();
          };
        }).pipe(
          retry(1),
          catchError((error) => {
            if (error instanceof Error) {
              this.logger.error({
                title: error.message,
                message: error.stack,
              });
            }

            return EMPTY;
          }),
          endWith(null),
        );
      }),
    );

    this.dbSubscription = this.dbFlow$.subscribe(this.db$);
    this.hmisSubscription = this.hmisFlow$.subscribe();
    this.qtProcessSubscription = this.qtProcessFlow$.subscribe(this.qtProcess$);
  }

  async dispose() {
    this.db$.complete();
    this.piscina.destroy();
    this.dbSubscription.unsubscribe();
    this.hmisSubscription.unsubscribe();
    this.qtProcessSubscription.unsubscribe();

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

  get running() {
    if (!this.qtProcess$.value) {
      return false;
    }

    return !this.qtProcess$.value?.killed;
  }

  get appPath() {
    const appPath = this.profile.state.qtAppPath;

    if (!appPath) {
      throw Error("必须先指定QT APP的工作目录");
    }

    return appPath;
  }
  getFlagFilePath() {
    return path.resolve(this.appPath, "../FlagFile");
  }
  getDataDirectory() {
    return fs.readFileSync(this.getFlagFilePath(), "utf8").trim();
  }
  getLocalDBPath(dataDirectory?: string) {
    const base = dataDirectory || this.getDataDirectory();

    return path.resolve(base, "./local.db");
  }
  getAppDBPath() {
    return path.resolve(this.appPath, "../local.db");
  }

  migrateDB({ source, target }: QTMigrateDBInput) {
    const sourceDB = drizzle({
      client: new DatabaseSync(source),
      schema,
      relations,
    });
    const targetDB = drizzle({
      client: new DatabaseSync(target),
      schema,
      relations,
    });

    try {
      targetDB.transaction((tx) => {
        const alxInfos = sourceDB.select().from(schema.alxInfo).all();
        tx.insert(schema.alxInfo)
          .values(alxInfos)
          .onConflictDoUpdate({
            target: schema.alxInfo.alxid,
            set: {
              alxname: sql`excluded.ALXNAME`,
              yblCt: sql`excluded.YBL_CT`,
              yblXhc: sql`excluded.YBL_XHC`,
              yblLz: sql`excluded.YBL_LZ`,
              halfAlxlen: sql`excluded.HALF_ALXLEN`,
              ftradius: sql`excluded.FTRADIUS`,
              ftradius0: sql`excluded.FTRADIUS0`,
              ftradius1: sql`excluded.FTRADIUS1`,
              ftradius2: sql`excluded.FTRADIUS2`,
              ftradius3: sql`excluded.FTRADIUS3`,
              ftradius4: sql`excluded.FTRADIUS4`,
              ftradius5: sql`excluded.FTRADIUS5`,
              ftradius6: sql`excluded.FTRADIUS6`,
              ftradius7: sql`excluded.FTRADIUS7`,
              ftlength0: sql`excluded.FTLENGTH0`,
              ftlength1: sql`excluded.FTLENGTH1`,
              ftlength2: sql`excluded.FTLENGTH2`,
              avgspeed: sql`excluded.AVGSPEED`,
              isdefault: sql`excluded.ISDEFAULT`,
            },
          })
          .run();
        const channels = sourceDB.select().from(schema.channels).all();
        tx.insert(schema.channels)
          .values(channels)
          .onConflictDoUpdate({
            target: schema.channels.recId,
            set: {
              nBoardIndex: sql`excluded.nBoardIndex`,
              nChannelIndex: sql`excluded.nChannelIndex`,
              nPhysicsIndex: sql`excluded.nPhysicsIndex`,
              nWheelIndex: sql`excluded.nWheelIndex`,
              szWheelName: sql`excluded.szWheelName`,
              szName: sql`excluded.szName`,
              nSleep: sql`excluded.nSleep`,
              nSmooth: sql`excluded.nSmooth`,
              ftRange: sql`excluded.ftRange`,
              nPluse: sql`excluded.nPluse`,
              nDelay: sql`excluded.nDelay`,
              nAtten: sql`excluded.nAtten`,
              nDbSub: sql`excluded.nDbSub`,
              nWangle: sql`excluded.nWangle`,
              nZsize: sql`excluded.nZsize`,
              ftDistance: sql`excluded.ftDistance`,
              bActive: sql`excluded.bActive`,
            },
          })
          .run();
        const gates = sourceDB.select().from(schema.gates).all();
        tx.insert(schema.gates)
          .values(gates)
          .onConflictDoUpdate({
            target: schema.gates.recId,
            set: {
              nBoardIndex: sql`excluded.nBoardIndex`,
              nChannelIndex: sql`excluded.nChannelIndex`,
              nChannelRectId: sql`excluded.nChannelRectId`,
              szGateName: sql`excluded.szGateName`,
              nGateId: sql`excluded.nGateId`,
              nSubGateId: sql`excluded.nSubGateId`,
              szColor: sql`excluded.szColor`,
              bActive: sql`excluded.bActive`,
              nLeft: sql`excluded.nLeft`,
              nWidth: sql`excluded.nWidth`,
              nTop: sql`excluded.nTop`,
              nBleft: sql`excluded.nBleft`,
              nBwidth: sql`excluded.nBwidth`,
              nBtop: sql`excluded.nBtop`,
              nB1Count: sql`excluded.nB1Count`,
              nB1Width: sql`excluded.nB1Width`,
              nB1Height: sql`excluded.nB1Height`,
              nB2Count: sql`excluded.nB2Count`,
              nB2Width: sql`excluded.nB2Width`,
              nB2Height: sql`excluded.nB2Height`,
              nE1Count: sql`excluded.nE1Count`,
              nE1Width: sql`excluded.nE1Width`,
              nE1Height: sql`excluded.nE1Height`,
              nE2Count: sql`excluded.nE2Count`,
              nE2Width: sql`excluded.nE2Width`,
              nE2Height: sql`excluded.nE2Height`,
              bSelected: sql`excluded.bSelected`,
            },
          })
          .run();
        const quartorChannels = sourceDB
          .select()
          .from(schema.quartorChannel)
          .all();
        tx.insert(schema.quartorChannel)
          .values(quartorChannels)
          .onConflictDoUpdate({
            target: schema.quartorChannel.recId,
            set: {
              nBoardIndex: sql`excluded.nBoardIndex`,
              nChannelIndex: sql`excluded.nChannelIndex`,
              nPhysicsIndex: sql`excluded.nPhysicsIndex`,
              nWheelIndex: sql`excluded.nWheelIndex`,
              szWheelName: sql`excluded.szWheelName`,
              szName: sql`excluded.szName`,
              nSleep: sql`excluded.nSleep`,
              nSmooth: sql`excluded.nSmooth`,
              ftRange: sql`excluded.ftRange`,
              nPluse: sql`excluded.nPluse`,
              nDelay: sql`excluded.nDelay`,
              nAtten: sql`excluded.nAtten`,
              nDbSub: sql`excluded.nDbSub`,
              nWangle: sql`excluded.nWangle`,
              nZsize: sql`nZsize`,
              ftDistance: sql`excluded.ftDistance`,
              bActive: sql`excluded.bActive`,
            },
          })
          .run();
        const quartorGates = sourceDB.select().from(schema.quartorGates).all();
        tx.insert(schema.quartorGates)
          .values(quartorGates)
          .onConflictDoUpdate({
            target: schema.quartorGates.recId,
            set: {
              nBoardIndex: sql`excluded.nBoardIndex`,
              nChannelIndex: sql`excluded.nChannelIndex`,
              nChannelRectId: sql`excluded.nChannelRectId`,
              szGateName: sql`excluded.szGateName`,
              nGateId: sql`excluded.nGateId`,
              nSubGateId: sql`excluded.nSubGateId`,
              szColor: sql`excluded.szColor`,
              bActive: sql`excluded.bActive`,
              nLeft: sql`excluded.nLeft`,
              nWidth: sql`excluded.nWidth`,
              nTop: sql`excluded.nTop`,
              nBleft: sql`excluded.nBleft`,
              nBwidth: sql`excluded.nBwidth`,
              nBtop: sql`excluded.nBtop`,
              nB1Count: sql`excluded.nB1Count`,
              nB1Width: sql`excluded.nB1Width`,
              nB1Height: sql`excluded.nB1Height`,
              nB2Count: sql`excluded.nB2Count`,
              nB2Width: sql`excluded.nB2Width`,
              nB2Height: sql`excluded.nB2Height`,
              nE1Count: sql`excluded.nE1Count`,
              nE1Width: sql`excluded.nE1Width`,
              nE1Height: sql`excluded.nE1Height`,
              nE2Count: sql`excluded.nE2Count`,
              nE2Width: sql`excluded.nE2Width`,
              nE2Height: sql`excluded.nE2Height`,
              bSelected: sql`excluded.bSelected`,
            },
          })
          .run();
        const quartorRecordInfos = sourceDB
          .select()
          .from(schema.quartorRecordInfo)
          .all();
        tx.insert(schema.quartorRecordInfo)
          .values(quartorRecordInfos)
          .onConflictDoUpdate({
            target: schema.quartorRecordInfo.recId,
            set: {
              szUserName: sql`excluded.szUserName`,
              tmNow: sql`excluded.tmNow`,
              szIds: sql`excluded.szIds`,
              nBoardIndex: sql`excluded.nBoardIndex`,
              nChannelIndex: sql`excluded.nChannelIndex`,
              bResult: sql`excluded.bResult`,
              bHorResult: sql`excluded.bHorResult`,
              nHorAtten: sql`excluded.nHorAtten`,
              fHorB0: sql`excluded.fHor_B0`,
              fHorB1: sql`excluded.fHor_B1`,
              fHorB2: sql`excluded.fHor_B2`,
              fHorB3: sql`excluded.fHor_B3`,
              fHorB4: sql`excluded.fHor_B4`,
              fHorB5: sql`excluded.fHor_B5`,
              fHorB0Llz: sql`excluded.fHor_B0_LLZ`,
              fHorB1Llz: sql`excluded.fHor_B1_LLZ`,
              fHorB2Llz: sql`excluded.fHor_B2_LLZ`,
              fHorB3Llz: sql`excluded.fHor_B3_LLZ`,
              fHorB4Llz: sql`excluded.fHor_B4_LLZ`,
              fHorB5Llz: sql`excluded.fHor_B5_LLZ`,
              fHorResult: sql`excluded.fHorResult`,
              bDesResult: sql`excluded.bDesResult`,
              nDesAttenH: sql`excluded.nDesAtten_H`,
              nDesAttenL: sql`excluded.nDesAtten_L`,
              nDesAtten: sql`excluded.nDesAtten`,
              bAttResult: sql`excluded.bAttResult`,
              fAttS0: sql`excluded.fAtt_S0`,
              fAttS1: sql`excluded.fAtt_S1`,
              fAttS: sql`excluded.fAtt_S`,
              bVerResult: sql`excluded.bVerResult`,
              fVerB0: sql`excluded.fVer_B0`,
              fVerB1: sql`excluded.fVer_B1`,
              fVerB2: sql`excluded.fVer_B2`,
              fVerB3: sql`excluded.fVer_B3`,
              fVerB4: sql`excluded.fVer_B4`,
              fVerB5: sql`excluded.fVer_B5`,
              fVerB6: sql`excluded.fVer_B6`,
              fVerB7: sql`excluded.fVer_B7`,
              fVerB8: sql`excluded.fVer_B8`,
              fVerB9: sql`excluded.fVer_B9`,
              fVerB10: sql`excluded.fVer_B10`,
              fVerB11: sql`excluded.fVer_B11`,
              fVerB12: sql`excluded.fVer_B12`,
              fVerB13: sql`excluded.fVer_B13`,
              fVerTgMaxB0: sql`excluded.fVerTgMax_B0`,
              fVerTgMaxB1: sql`excluded.fVerTgMax_B1`,
              fVerTgMaxB2: sql`excluded.fVerTgMax_B2`,
              fVerTgMaxB3: sql`excluded.fVerTgMax_B3`,
              fVerTgMaxB4: sql`excluded.fVerTgMax_B4`,
              fVerTgMaxB5: sql`excluded.fVerTgMax_B5`,
              fVerTgMaxB6: sql`excluded.fVerTgMax_B6`,
              fVerTgMaxB7: sql`excluded.fVerTgMax_B7`,
              fVerTgMaxB8: sql`excluded.fVerTgMax_B8`,
              fVerTgMaxB9: sql`excluded.fVerTgMax_B9`,
              fVerTgMaxB10: sql`excluded.fVerTgMax_B10`,
              fVerTgMaxB11: sql`excluded.fVerTgMax_B11`,
              fVerTgMaxB12: sql`excluded.fVerTgMax_B12`,
              fVerTgMaxB13: sql`excluded.fVerTgMax_B13`,
              nDynS1: sql`excluded.nDyn_S1`,
              nDynS2: sql`excluded.nDyn_S2`,
              nDynMax: sql`excluded.nDyn_MAX`,
            },
          })
          .run();
        const sysConfigs = sourceDB.select().from(schema.sysConfig).all();
        tx.insert(schema.sysConfig)
          .values(sysConfigs)
          .onConflictDoUpdate({
            target: schema.sysConfig.recId,
            set: {
              typeName: sql`excluded.TypeName`,
              configKey: sql`excluded.ConfigKey`,
              configValue: sql`excluded.ConfigValue`,
              defaultValue: sql`excluded.DefaultValue`,
              remark: sql`excluded.Remark`,
              isReadOnly: sql`excluded.IsReadOnly`,
            },
          })
          .run();
        const users = sourceDB.select().from(schema.userManager).all();
        tx.insert(schema.userManager)
          .values(users)
          .onConflictDoUpdate({
            target: schema.userManager.recId,
            set: {
              userName: sql`excluded.UserName`,
              pwd: sql`excluded.Pwd`,
              name: sql`excluded.Name`,
              power: sql`excluded.Power`,
              regTime: sql`excluded.RegTime`,
            },
          })
          .run();
        const yqConfigs = sourceDB.select().from(schema.yqConfig).all();
        tx.insert(schema.yqConfig)
          .values(yqConfigs)
          .onConflictDoUpdate({
            target: schema.yqConfig.recId,
            set: {
              factoryName: sql`excluded.FactoryName`,
              yqName: sql`excluded.YQName`,
              yqid: sql`excluded.YQID`,
              channelNums: sql`excluded.ChannelNums`,
              productionDate: sql`excluded.ProductionDate`,
              installationDate: sql`excluded.InstallationDate`,
              commMode: sql`excluded.CommMode`,
              commParam: sql`excluded.CommParam`,
              commParamBack: sql`excluded.CommParamBack`,
              dllPath: sql`excluded.DllPath`,
              usedFlag: sql`excluded.UsedFlag`,
            },
          })
          .run();
      });
    } finally {
      sourceDB.$client.close();
      targetDB.$client.close();
    }

    return { running: this.running };
  }

  reconnectDB() {
    this.dbSubscription.unsubscribe();
    this.dbSubscription = this.dbFlow$.subscribe(this.db$);
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

    const dataDirectroy = this.getDataDirectory();
    const imageDirectory = path.resolve(dataDirectroy, "./verifies", id);
    const { szIds, szWhModel } = record;
    const lct = path.resolve(imageDirectory, `${szIds}.${szWhModel}.LCT.bmp`);
    const llz = path.resolve(imageDirectory, `${szIds}.${szWhModel}.LLZ.bmp`);
    const lxh = path.resolve(imageDirectory, `${szIds}.${szWhModel}.LXH.bmp`);
    const rct = path.resolve(imageDirectory, `${szIds}.${szWhModel}.RCT.bmp`);
    const rlz = path.resolve(imageDirectory, `${szIds}.${szWhModel}.RLZ.bmp`);
    const rxh = path.resolve(imageDirectory, `${szIds}.${szWhModel}.RXH.bmp`);
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
          schema.quartorsData.precId,
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
    this.qtProcessTrigger$.next(null);

    return this.qtProcess$.value?.pid;
  }
  async stopApp() {
    this.qtProcess$.value?.kill();
  }

  async setFlagFile(qtDataDirectory: string) {
    const nextLocalDB = this.getLocalDBPath(qtDataDirectory);

    if (!fs.existsSync(nextLocalDB)) {
      await fs.promises.mkdir(qtDataDirectory, {
        recursive: true,
        mode: 0o755,
      });

      const appDBPath = this.getAppDBPath();

      await fs.promises.cp(appDBPath, nextLocalDB, {
        errorOnExist: true,
      });
    }

    const previousLocalDB = this.getLocalDBPath();

    if (fs.existsSync(previousLocalDB)) {
      this.migrateDB({ source: previousLocalDB, target: nextLocalDB });
    }

    const flagFilePath = this.getFlagFilePath();

    await fs.promises.writeFile(flagFilePath, qtDataDirectory, {
      encoding: "utf8",
      flag: "w",
    });

    return { running: this.running };
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

    return { result, running: this.running };
  }

  async setDeviceConfigLib({ lib, id }: SetYiqiConfigLibInput) {
    const result = await this.db
      .update(schema.yqConfig)
      .set({ dllPath: lib })
      .where(eq(schema.yqConfig.recId, id))
      .returning();

    return { result, running: this.running };
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

    return { rows, running: this.running };
  }
  async deleteUsers(id: number) {
    const row = await this.db
      .delete(schema.userManager)
      .where(eq(schema.userManager.recId, id))
      .returning();

    return { row, running: this.running };
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

    return { result, running: this.running };
  }
}
