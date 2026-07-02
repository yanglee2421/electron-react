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
  Detecotor,
  Detection,
  DetectionData,
  FilterDateValue,
  FilterInValues,
  FilterValue,
  Quartor,
  QuartorData,
  QuartorYearlyData,
  TableQueryResult,
  User,
  Verify,
  VerifyData,
} from "./types";
import workerPath from "./worker?modulePath";

class AppPathInfo {
  private databaseType: DatabaseType = "app";
  private profile: Profile;

  constructor(profile: Profile) {
    this.profile = profile;
  }

  app() {
    this.databaseType = "app";
  }

  root() {
    this.databaseType = "root";
  }

  async mdb() {
    const databaseType = this.databaseType;

    switch (databaseType) {
      case "app":
        return this.appDb();
      case "root":
        const rootPath = await this.rootDb();
        return rootPath;
      default:
        throw new Error(`Unsupported database type: ${databaseType}`);
    }
  }

  async rootFolder() {
    const { appPath, encoding } = this.profile.state;
    const iniPath = path.resolve(appPath, "usprofile.ini");
    const iniBuffer = await fs.promises.readFile(iniPath);
    const iniText = iconv.decode(iniBuffer, encoding);
    const userProfile = ini.parse(iniText);
    const rootPath = userProfile.FileSystem.Root as string;

    return rootPath;
  }

  imagePath(rootPath: string, fileName: string) {
    return path.resolve(rootPath, "_verify", fileName);
  }

  dataImagePath(rootPath: string, fileName: string) {
    return path.resolve(rootPath, "_data", fileName);
  }

  quartorImagePath(rootPath: string, fileName: string) {
    return path.resolve(rootPath, "_quartor", fileName);
  }

  async rootDb() {
    const rootPath = await this.rootFolder();

    return path.resolve(rootPath, "local.mdb");
  }

  appDb() {
    const { appPath } = this.profile.state;
    return path.resolve(appPath, "Data", "local.mdb");
  }
}

interface TableQueryBuilderOptions {
  piscina: Piscina;
  appPathInfo: AppPathInfo;
  tableName: string;
}

class TableQueryBuilder<
  TRow,
  TResult = TableQueryResult<TRow>,
> extends QueryPromise<TResult> {
  private likes: FilterValue[] = [];
  private equals: FilterValue[] = [];
  private ins: FilterInValues[] = [];
  private dates: FilterDateValue[] = [];
  private offsetValue: number = 0;
  private limitValue: number = Infinity;
  private piscina: Piscina;
  private appPathInfo: AppPathInfo;
  private tableName: string;
  private orderByKey?: unknown;
  private orderByDirection?: "asc" | "desc";
  private ltKey?: unknown;
  private ltValue?: number;
  private gtKey?: unknown;
  private gtValue?: number;

  constructor(options: TableQueryBuilderOptions) {
    super();

    const { piscina, appPathInfo, tableName } = options;

    this.piscina = piscina;
    this.appPathInfo = appPathInfo;
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
  orderBy<TKey extends keyof TRow>(
    key: TKey,
    direction: "asc" | "desc" = "asc",
  ) {
    this.orderByKey = key;
    this.orderByDirection = direction;

    return this;
  }
  lt<TKey extends keyof TRow>(key: TKey, value: number) {
    this.ltKey = key;
    this.ltValue = value;

    return this;
  }
  gt<TKey extends keyof TRow>(key: TKey, value: number) {
    this.ltKey = key;
    this.ltValue = value;

    return this;
  }

  async execute(): Promise<TResult> {
    const databasePath = await this.appPathInfo.mdb();

    return this.piscina.run({
      databasePath,
      tableName: this.tableName,
      offset: this.offsetValue,
      limit: this.limitValue,
      likes: this.likes,
      equals: this.equals,
      ins: this.ins,
      dates: this.dates,
      orderBy: this.orderByKey,
      orderByDirection: this.orderByDirection,
      ltKey: this.ltKey,
      ltValue: this.ltValue,
      gtKey: this.gtKey,
      gtValue: this.gtValue,
    });
  }
}

class Database {
  private piscina: Piscina;
  private appPathInfo: AppPathInfo;

  constructor(piscina: Piscina, appPathInfo: AppPathInfo) {
    this.piscina = piscina;
    this.appPathInfo = appPathInfo;
  }

  private table<T>(tableName: string) {
    return new TableQueryBuilder<T>({
      piscina: this.piscina,
      appPathInfo: this.appPathInfo,
      tableName,
    });
  }

  /**
   * @description 单位
   */
  async corporation(): Promise<Corporation> {
    const query = await this.table<Corporation>("corporation");
    const [result] = query.rows;

    if (!result) {
      throw new Error("未找到单位信息");
    }

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
  detectors() {
    return this.table<Detecotor>("detectors");
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
  verifies() {
    return this.table<Verify>("verifies");
  }
  /**
   * @description 日常校验检出的伤
   */
  verifies_data() {
    return this.table<VerifyData>("verifies_data");
  }
  /**
   * @description 用户
   */
  users() {
    return this.table<User>("users");
  }
}

export class MDB {
  private piscina: Piscina;
  private appPathInfo: AppPathInfo;

  constructor({ profile }: AppCradle) {
    this.piscina = new Piscina({
      filename: workerPath,
      minThreads: 1,
      maxThreads: os.cpus().length,
    });
    this.appPathInfo = new AppPathInfo(profile);
  }

  dispose() {
    this.piscina.destroy();
  }

  private database() {
    return new Database(this.piscina, this.appPathInfo);
  }

  app() {
    this.appPathInfo.app();

    return this.database();
  }
  root() {
    this.appPathInfo.root();

    return this.database();
  }

  rootFolder() {
    return this.appPathInfo.rootFolder();
  }
  imagePath(rootPath: string, fileName: string) {
    return this.appPathInfo.imagePath(rootPath, fileName);
  }
  dataImagePath(rootPath: string, fileName: string) {
    return this.appPathInfo.dataImagePath(rootPath, fileName);
  }
  quartorImagePath(rootPath: string, fileName: string) {
    return this.appPathInfo.quartorImagePath(rootPath, fileName);
  }
}
