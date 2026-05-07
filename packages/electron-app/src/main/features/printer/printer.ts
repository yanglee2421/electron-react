import { atFirstOrThrow } from "@yotulee/run";
import type { MDB } from "../mdb";
import type { AppCradle } from "../types";

export class Printer {
  private mdb: MDB;

  constructor({ mdb }: AppCradle) {
    this.mdb = mdb;
  }

  async getDataForCHR501(id: string) {
    const records = await this.mdb.root().verifies().equal("szIDs", id);
    const record = atFirstOrThrow(
      records.rows,
      () => new Error(`未找到ID为${id}的检测数据`),
    );

    const datas = await this.mdb.root().verifies_data().equal("opid", id);
    const corporation = await this.mdb.app().corporation();
    const detectors = await this.mdb
      .app()
      .detectors()
      .equal("szwheel", record.szWHModel || "");

    return {
      record: record,
      datas: datas.rows,
      corporation,
      detectors: detectors.rows,
    };
  }
}
