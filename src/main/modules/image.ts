import * as fs from "node:fs";
import * as path from "node:path";
import { chunk } from "#main/utils";
import { channel } from "#main/channel";
import { ipcHandle, ls } from "#main/lib";
import createImageWorker from "./image.worker?nodeWorker";

const computeMD5 = (files: string[]) => {
  const worker = createImageWorker({
    workerData: { files },
  });

  return new Promise<Record<string, string>>((resolve, reject) => {
    worker.once("message", (data) => {
      resolve(data);
      worker.terminate();
    });
    worker.once("error", (error) => {
      reject(error);
      worker.terminate();
    });
  });
};

const createMD5ToFile = () => {
  const md5ToFilePath = new Map<string, string>();
  return md5ToFilePath;
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

const deduplicate = async (
  pathSet: Set<string>,
  md5ToFilePath: Map<string, string>,
) => {
  const tasks = Array.from(chunk([...pathSet], 1000), async (files) => {
    const record = await computeMD5(files);
    return record;
  });

  const result = await Promise.all(tasks);
  result.forEach((record) => {
    Object.entries(record).forEach(([key, value]) => {
      md5ToFilePath.set(key, value);
    });
  });
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
  const md5ToFilePath = createMD5ToFile();
  const pathSet = new Set<string>();

  await ls(source, pathSet);
  await deduplicate(pathSet, md5ToFilePath);

  const outputDirectory = await getOutputDirectory(source);
  await copyFile(md5ToFilePath, outputDirectory);
};

export const bindIpcHandler = () => {
  ipcHandle(channel.MD5_BACKUP_IMAGE, async (_, payload: string) => {
    await bootstrap(payload);
  });
  ipcHandle(channel.MD5_COMPUTE, async (_, payload: string) => {
    const record = await computeMD5([payload]);
    return record;
  });
};
