import { ls } from "#main/lib/fs";
import { type IpcHandle } from "#main/lib/ipc";
import { chunk } from "@yotulee/run";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pLimit from "p-limit";
import { Piscina } from "piscina";
import workerPath from "./image.worker?modulePath";

export class ImageModule {
  private piscina: Piscina;

  constructor() {
    this.piscina = new Piscina({
      filename: workerPath,
      minThreads: 1,
      maxThreads: os.cpus().length,
    });
  }

  computeMD5(files: string[]): Promise<Record<string, string>> {
    // const worker = createImageWorker({
    //   workerData: { files },
    // });

    // return new Promise<Record<string, string>>((resolve, reject) => {
    //   worker.once("message", (data) => {
    //     resolve(data);
    //     worker.terminate();
    //   });
    //   worker.once("error", (error) => {
    //     reject(error);
    //     worker.terminate();
    //   });
    // });

    return this.piscina.run({ files });
  }
  async deduplicate(pathSet: string[]) {
    const md5ToFilePath = new Map<string, string>();
    const limit = pLimit(os.cpus().length);

    const result = await Promise.all(
      chunk(pathSet, 1000).map((files) =>
        limit(async () => {
          const record = await this.computeMD5(files);
          return record;
        }),
      ),
    );
    result.forEach((record) => {
      Object.entries(record).forEach(([key, value]) => {
        md5ToFilePath.set(key, value);
      });
    });

    return md5ToFilePath;
  }

  async handleImageBackup(source: string) {
    const paths = await ls(source);
    const md5ToFilePath = await this.deduplicate(paths);

    const outputDirectory = await getOutputDirectory(source);
    await copyFile(md5ToFilePath, outputDirectory);
  }

  dispose() {
    void this.piscina.destroy();
  }
}

const getOutputDirectory = async (source: string) => {
  const parentDirectory = path.resolve(source, "..");
  const basename = path.basename(source);
  const today = new Date();
  const destination = path.resolve(
    parentDirectory,
    `${basename}-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`,
  );
  await fs.promises.mkdir(destination, { recursive: true });
  return destination;
};

const copyFile = async (
  md5ToFilePath: Map<string, string>,
  outputDirectory: string,
) => {
  for (const [md5, filePath] of md5ToFilePath) {
    const extname = path.extname(filePath);
    const destination = path.resolve(outputDirectory, `${md5}${extname}`);
    await fs.promises.cp(filePath, destination);
  }
};

export const bindIpcHandlers = (
  imageModule: ImageModule,
  ipcHandle: IpcHandle,
) => {
  ipcHandle("MD5/MD5_BACKUP_IMAGE", (_, payload: string) => {
    return imageModule.handleImageBackup(payload);
  });
  ipcHandle("MD5/MD5_COMPUTE", (_, payload: string) => {
    return imageModule.computeMD5([payload]);
  });
};
