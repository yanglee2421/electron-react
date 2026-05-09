import { atFirstOrThrow } from "@yotulee/run";
import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
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
    const rootPath = await this.mdb.rootFolder();
    const lctImage = this.mdb.imagePath(rootPath, `${record.szIDs}.LCT.bmp`);
    const rctImage = this.mdb.imagePath(rootPath, `${record.szIDs}.RCT.bmp`);
    const llzImage = this.mdb.imagePath(rootPath, `${record.szIDs}.LLZ.bmp`);
    const rlzImage = this.mdb.imagePath(rootPath, `${record.szIDs}.RLZ.bmp`);
    const lxhImage = this.mdb.imagePath(rootPath, `${record.szIDs}.LXH.bmp`);
    const rxhImage = this.mdb.imagePath(rootPath, `${record.szIDs}.RXH.bmp`);

    return {
      record: record,
      datas: datas.rows,
      corporation,
      detectors: detectors.rows,
      images: {
        lct: lctImage,
        rct: rctImage,
        llz: llzImage,
        rlz: rlzImage,
        lxh: lxhImage,
        rxh: rxhImage,
      },
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
