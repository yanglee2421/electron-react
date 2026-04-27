import os from "node:os";
import { Piscina } from "piscina";
import { QueryPromise } from "../query-promise/query-promise";
import type {
  Corporation,
  FilterDateValue,
  FilterInValues,
  FilterValue,
} from "./mdb.types";
import workerPath from "./mdb.worker?modulePath";

interface TableQueryBuilderOptions {
  piscina: Piscina;
  databasePath: string;
  tableName: string;
}

class TableQueryBuilder<T> extends QueryPromise<T> {
  private piscina: Piscina;
  private databasePath: string;
  private tableName: string;
  private offsetValue: number = 0;
  private limitValue: number = 20;
  private likes: FilterValue[] = [];
  private equals: FilterValue[] = [];
  private ins: FilterInValues[] = [];
  private dates: FilterDateValue[] = [];

  constructor(options: TableQueryBuilderOptions) {
    super();

    const { piscina, databasePath, tableName } = options;

    this.piscina = piscina;
    this.databasePath = databasePath;
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
  like<TKey extends keyof T>(key: TKey, value: T[TKey]) {
    this.likes.push({ key, value });

    return this;
  }
  equal<TKey extends keyof T>(key: TKey, value: T[TKey]) {
    this.equals.push({ key, value });

    return this;
  }
  in<TKey extends keyof T>(key: TKey, values: T[TKey][]) {
    this.ins.push({ key, values });

    return this;
  }
  date<TKey extends keyof T>(key: TKey, startAt: Date, endAt: Date) {
    this.dates.push({ key, startAt, endAt });

    return this;
  }

  execute(): Promise<T> {
    return this.piscina.run({
      databasePath: this.databasePath,
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
  private databasePath: string;

  constructor(piscina: Piscina, databasePath: string) {
    this.piscina = piscina;
    this.databasePath = databasePath;
  }

  private table(tableName: string) {
    return new TableQueryBuilder({
      piscina: this.piscina,
      databasePath: this.databasePath,
      tableName,
    });
  }

  /**
   * @description 单位
   */
  async corporation(): Promise<Corporation> {
    const [result]: [Corporation] = await this.piscina.run({
      databasePath: this.databasePath,
      tableName: "corporation",
    });

    return result;
  }
  /**
   * @description 现车作业
   */
  detections() {
    return this.table("detections");
  }
  /**
   * @description 现车作业检出的伤
   */
  detections_data() {
    return this.table("detections_data");
  }
  /**
   * @description 年度校验
   */
  Quartor() {
    return this.table("Quartor");
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
    return this.table("quartors");
  }
  /**
   * @description 季度校验检出的伤
   */
  quartors_data() {
    return this.table("quartors_data");
  }
  /**
   * @description 日常校验
   */
  verifyes() {
    return this.table("verifyes");
  }
  /**
   * @description 日常校验检出的伤
   */
  verifyes_data() {
    return this.table("verifyes_data");
  }
}

interface MDBConstructorOptions {
  appDBPath: string;
  rootDBPath: string;
}

export class MDB {
  private piscina: Piscina;
  private appDBPath: string;
  private rootDBPath: string;
  private databasePath: string;

  constructor(options: MDBConstructorOptions) {
    this.piscina = new Piscina({
      filename: workerPath,
      minThreads: 1,
      maxThreads: os.cpus().length,
    });

    const { appDBPath, rootDBPath } = options;

    this.appDBPath = appDBPath;
    this.rootDBPath = rootDBPath;
    this.databasePath = appDBPath;
  }

  setAppDBPath(path: string) {
    this.appDBPath = path;
  }
  setRootDBPath(path: string) {
    this.rootDBPath = path;
  }

  private database() {
    return new Database(this.piscina, this.databasePath);
  }

  app() {
    this.databasePath = this.appDBPath;

    return this.database();
  }
  root() {
    this.databasePath = this.rootDBPath;

    return this.database();
  }
  dispose() {
    this.piscina.destroy();
  }
}
