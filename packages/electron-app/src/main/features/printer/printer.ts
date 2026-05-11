import { atFirstOrThrow } from "@yotulee/run";
import { app, BrowserWindow } from "electron";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Piscina from "piscina";
import type { MDB } from "../mdb";
import type { AppCradle } from "../types";
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
    const tmpPath = app.getPath("temp");

    const jpegs = await this.piscina.run({
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
}
