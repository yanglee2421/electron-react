import { ls } from "#main/lib/fs";
import { ipcHandle } from "#main/lib/ipc";
import { chunk } from "@yotulee/run";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pLimit from "p-limit";
import { Piscina } from "piscina";
import workerPath from "./image.worker?modulePath";

const piscina = new Piscina({
  filename: workerPath,
  minThreads: 1,
  maxThreads: os.cpus().length,
});

const computeMD5 = (files: string[]): Promise<Record<string, string>> => {
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

  return piscina.run({ files });
};

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

const deduplicate = async (pathSet: string[]) => {
  const md5ToFilePath = new Map<string, string>();
  const limit = pLimit(os.cpus().length);

  const result = await Promise.all(
    chunk(pathSet, 1000).map((files) =>
      limit(async () => {
        const record = await computeMD5(files);
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

const bootstrap = async (source: string) => {
  const paths = await ls(source);
  const md5ToFilePath = await deduplicate(paths);

  const outputDirectory = await getOutputDirectory(source);
  await copyFile(md5ToFilePath, outputDirectory);
};

export const bindIpcHandlers = () => {
  ipcHandle("MD5/MD5_BACKUP_IMAGE", async (_, payload: string) => {
    await bootstrap(payload);
  });
  ipcHandle("MD5/MD5_COMPUTE", async (_, payload: string) => {
    const record = await computeMD5([payload]);
    return record;
  });
};
