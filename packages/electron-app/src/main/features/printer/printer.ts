import { atFirstOrThrow } from "@yotulee/run";
import dayjs from "dayjs";
import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Piscina from "piscina";
import type { MDB } from "../mdb";
import type { AppCradle } from "../types";
import type { ChannelImage } from "./types";
import workerPath from "./worker?modulePath";

export class Printer {
  private piscina: Piscina;
  private mdb: MDB;

  constructor({ mdb }: AppCradle) {
    this.mdb = mdb;

    this.piscina = new Piscina({
      filename: workerPath,
      minThreads: 1,
      maxThreads: os.cpus().length,
    });
  }

  dispose() {
    const tmpPath = path.resolve(app.getPath("temp"), app.getName());

    // Cleanup temporary files created by worker threads
    if (fs.existsSync(tmpPath)) {
      fs.rmSync(tmpPath, { recursive: true, force: true });
    }
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
    const rootPath = await this.mdb.rootFolder();
    const lctImage = this.mdb.imagePath(rootPath, `${record.szIDs}.LCT.bmp`);
    const rctImage = this.mdb.imagePath(rootPath, `${record.szIDs}.RCT.bmp`);
    const llzImage = this.mdb.imagePath(rootPath, `${record.szIDs}.LLZ.bmp`);
    const rlzImage = this.mdb.imagePath(rootPath, `${record.szIDs}.RLZ.bmp`);
    const lxhImage = this.mdb.imagePath(rootPath, `${record.szIDs}.LXH.bmp`);
    const rxhImage = this.mdb.imagePath(rootPath, `${record.szIDs}.RXH.bmp`);
    const tmpPath = path.resolve(app.getPath("temp"), app.getName());

    await fs.promises.mkdir(tmpPath, { recursive: true });

    const jpegs: ChannelImage = await this.piscina.run({
      tmpPath,
      lct: lctImage,
      rct: rctImage,
      llz: llzImage,
      rlz: rlzImage,
      lxh: lxhImage,
      rxh: rxhImage,
    });

    return {
      record: record,
      datas: datas.rows,
      corporation,
      detectors: detectors.rows,
      images: jpegs,
    };
  }

  async print() {
    const win = BrowserWindow.getFocusedWindow();

    if (!win) return;

    const buf = await win.webContents.printToPDF({});
    const filePath = path.resolve(
      app.getPath("desktop"),
      `print-${Date.now()}.pdf`,
    );
    await fs.promises.writeFile(filePath, buf);
  }

  async getDataForCHR502(ids: string[]) {
    const records = await this.mdb
      .root()
      .quartors()
      .orderBy("tmnow", "asc")
      .in("szIDs", ids)
      .limit(5);

    const queryPreviousRecord = this.mdb
      .root()
      .quartors()
      .orderBy("tmnow", "desc")
      .limit(1);

    const firstRecord = records.rows.at(0);

    if (firstRecord) {
      const firstDay = dayjs(firstRecord.tmnow).toDate().getTime();

      queryPreviousRecord
        .lt("tmnow", firstDay)
        .equal("szWHModel", firstRecord.szWHModel || "");
    }

    const previousRecord = await queryPreviousRecord;

    const datas = await this.mdb
      .root()
      .quartors_data()
      .in(
        "opid",
        records.rows.map((r) => r.szIDs),
      );

    const corporation = await this.mdb.app().corporation();

    return {
      records: records.rows,
      flaws: datas.rows,
      previousRecord: previousRecord.rows.at(0) || null,
      corporation,
    };
  }

  async getDataForCHR503(id: string) {
    const rows = await this.mdb.root().Quartor().equal("szIDs", id);

    if (rows.rows.length === 0) {
      throw new Error(`未找到ID为${id}的记录`);
    }

    const corporation = await this.mdb.app().corporation();

    return {
      rows: rows.rows,
      corporation,
    };
  }

  async getDataForCHR53A(ids: string[]) {
    const rows = await this.mdb.root().detections().in("szIDs", ids);
    const corporation = await this.mdb.app().corporation();

    return { records: rows.rows, corporation };
  }

  async getDataForCHR52A(id: string) {
    const recordResult = await this.mdb
      .root()
      .detections()
      .equal("szIDs", id)
      .limit(1);

    const record = recordResult.rows.at(0);

    if (!record) {
      throw new Error(`未找到ID为${id}的记录`);
    }

    const datasResult = await this.mdb
      .root()
      .detections_data()
      .equal("opid", id);

    const corporation = await this.mdb.app().corporation();
    const rootPath = await this.mdb.rootFolder();
    const lctImage = this.mdb.dataImagePath(
      rootPath,
      `${record.szIDs}.LCT.bmp`,
    );
    const rctImage = this.mdb.dataImagePath(
      rootPath,
      `${record.szIDs}.RCT.bmp`,
    );
    const llzImage = this.mdb.dataImagePath(
      rootPath,
      `${record.szIDs}.LLZ.bmp`,
    );
    const rlzImage = this.mdb.dataImagePath(
      rootPath,
      `${record.szIDs}.RLZ.bmp`,
    );
    const lxhImage = this.mdb.dataImagePath(
      rootPath,
      `${record.szIDs}.LXH.bmp`,
    );
    const rxhImage = this.mdb.dataImagePath(
      rootPath,
      `${record.szIDs}.RXH.bmp`,
    );
    const tmpPath = path.resolve(app.getPath("temp"), app.getName());

    await fs.promises.mkdir(tmpPath, { recursive: true });

    const jpegs: ChannelImage = await this.piscina.run({
      tmpPath,
      lct: lctImage,
      rct: rctImage,
      llz: llzImage,
      rlz: rlzImage,
      lxh: lxhImage,
      rxh: rxhImage,
    });

    return {
      record,
      datas: datasResult.rows,
      corporation,
      jpegs,
    };
  }
}
