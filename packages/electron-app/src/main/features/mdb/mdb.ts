import iconv from "iconv-lite";
import ini from "ini";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Piscina } from "piscina";
import type { Profile } from "../profile";
import { QueryPromise } from "../query-promise/query-promise";
import type { AppCradle } from "../types";
import type {
  Corporation,
  DatabaseType,
  Detection,
  DetectionData,
  FilterDateValue,
  FilterInValues,
  FilterValue,
  Quartor,
  QuartorData,
  QuartorYearlyData,
  TableQueryResult,
  Verify,
  VerifyData,
} from "./types";
import workerPath from "./worker?modulePath";

const resolveAppDBPath = (appPath: string) => {
  return path.resolve(appPath, "Data", "local.mdb");
};

const resolveRootDBPath = async (appPath: string, encoding: string) => {
  const iniPath = path.resolve(appPath, "usprofile.ini");
  const iniBuffer = await fs.promises.readFile(iniPath);
  const iniText = iconv.decode(iniBuffer, encoding);
  const userProfile = ini.parse(iniText);
  const rootPath = userProfile.FileSystem.Root as string;

  return rootPath;
};

const resolveDBPath = async (
  appPath: string,
  encoding: string,
  type: DatabaseType,
) => {
  switch (type) {
    case "app":
      return resolveAppDBPath(appPath);
    case "root":
      const rootPath = await resolveRootDBPath(appPath, encoding);
      return path.resolve(rootPath, "local.mdb");
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
};

interface TableQueryBuilderOptions {
  piscina: Piscina;
  profile: Profile;
  databaseType: DatabaseType;
  tableName: string;
}

class TableQueryBuilder<
  TRow,
  TResult = TableQueryResult<TRow>,
> extends QueryPromise<TResult> {
  private piscina: Piscina;
  private profile: Profile;
  private databaseType: DatabaseType;
  private tableName: string;
  private offsetValue: number = 0;
  private limitValue: number = 20;
  private likes: FilterValue[] = [];
  private equals: FilterValue[] = [];
  private ins: FilterInValues[] = [];
  private dates: FilterDateValue[] = [];

  constructor(options: TableQueryBuilderOptions) {
    super();

    const { piscina, profile, databaseType, tableName } = options;

    this.piscina = piscina;
    this.profile = profile;
    this.databaseType = databaseType;
    this.tableName = tableName;
  }

  offset(index: number) {
    this.offsetValue = index;

    return this;
  }
  limit(size: number) {
    this.limitValue = size;

    return this;
  }
  like<TKey extends keyof TRow>(key: TKey, value: TRow[TKey]) {
    this.likes.push({ key, value });

    return this;
  }
  equal<TKey extends keyof TRow>(key: TKey, value: TRow[TKey]) {
    this.equals.push({ key, value });

    return this;
  }
  in<TKey extends keyof TRow>(key: TKey, values: TRow[TKey][]) {
    this.ins.push({ key, values });

    return this;
  }
  date<TKey extends keyof TRow>(key: TKey, startAt: Date, endAt: Date) {
    this.dates.push({ key, startAt, endAt });

    return this;
  }

  async execute(): Promise<TResult> {
    const databasePath = await resolveDBPath(
      this.profile.state.appPath,
      this.profile.state.encoding,
      this.databaseType,
    );

    return this.piscina.run({
      databasePath,
      tableName: this.tableName,
      offset: this.offsetValue,
      limit: this.limitValue,
      likes: this.likes,
      equals: this.equals,
      ins: this.ins,
      dates: this.dates,
    });
  }
}

class Database {
  private piscina: Piscina;
  private profile: Profile;
  private databaseType: DatabaseType;

  constructor(piscina: Piscina, profile: Profile, databaseType: DatabaseType) {
    this.piscina = piscina;
    this.profile = profile;
    this.databaseType = databaseType;
  }

  private table<T>(tableName: string) {
    return new TableQueryBuilder<T>({
      piscina: this.piscina,
      profile: this.profile,
      databaseType: this.databaseType,
      tableName,
    });
  }

  /**
   * @description 单位
   */
  async corporation(): Promise<Corporation> {
    const [result]: [Corporation] = await this.piscina.run({
      databasePath: path.resolve(
        this.profile.state.appPath,
        "Data",
        "local.mdb",
      ),
      tableName: "corporation",
    });

    return result;
  }
  /**
   * @description 现车作业
   */
  detections() {
    return this.table<Detection>("detections");
  }
  /**
   * @description 现车作业检出的伤
   */
  detections_data() {
    return this.table<DetectionData>("detections_data");
  }
  /**
   * @description 年度校验
   */
  Quartor() {
    return this.table<QuartorYearlyData>("Quartor");
  }
  /**
   * @description 年度校验的参数
   */
  QuartorParas() {
    return this.table("QuartorParas");
  }
  /**
   * @description 季度校验
   */
  quartors() {
    return this.table<Quartor>("quartors");
  }
  /**
   * @description 季度校验检出的伤
   */
  quartors_data() {
    return this.table<QuartorData>("quartors_data");
  }
  /**
   * @description 日常校验
   */
  verifyes() {
    return this.table<Verify>("verifyes");
  }
  /**
   * @description 日常校验检出的伤
   */
  verifyes_data() {
    return this.table<VerifyData>("verifyes_data");
  }
}

export class MDB {
  private piscina: Piscina;
  private databaseType: DatabaseType = "app";
  private profile: Profile;

  constructor({ profile }: AppCradle) {
    this.piscina = new Piscina({
      filename: workerPath,
      minThreads: 1,
      maxThreads: os.cpus().length,
    });
    this.profile = profile;
  }

  private database() {
    return new Database(this.piscina, this.profile, this.databaseType);
  }

  app() {
    this.databaseType = "app";

    return this.database();
  }
  root() {
    this.databaseType = "root";

    return this.database();
  }
  dispose() {
    this.piscina.destroy();
  }
}
