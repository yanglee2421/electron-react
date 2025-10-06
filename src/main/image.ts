import * as fs from "node:fs";
import * as path from "node:path";
import * as utils from "node:util";
import { ipcHandle } from "./lib";
import { channel } from "./channel";
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
  const mkdir = utils.promisify(fs.mkdir);
  await mkdir(destination, { recursive: true });
  return destination;
};

const chunk = <TElement>(array: TElement[], size: number): TElement[][] => {
  const result: TElement[][] = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
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
  const cp = utils.promisify(fs.cp);

  for (const [md5, filePath] of md5ToFilePath) {
    const extname = path.extname(filePath);
    const destination = path.resolve(outputDirectory, `${md5}${extname}`);
    await cp(filePath, destination);
  }
};

const getFilePaths = async (directory: string, pathSet: Set<string>) => {
  const readdir = utils.promisify(fs.readdir);
  const basenames = await readdir(directory);
  const stat = utils.promisify(fs.stat);

  for (const basename of basenames) {
    const fullPath = path.resolve(directory, basename);
    const pathState = await stat(fullPath);
    const isDirectory = pathState.isDirectory();
    const isFile = pathState.isFile();

    if (isDirectory) {
      await getFilePaths(fullPath, pathSet);
    }

    if (!isFile) {
      continue;
    }

    const extname = path.extname(fullPath);

    if (extname === ".json") {
      continue;
    }

    pathSet.add(fullPath);
  }
};

const bootstrap = async (source: string) => {
  const md5ToFilePath = createMD5ToFile();
  const pathSet = new Set<string>();
  console.time("bootstrap");

  await getFilePaths(source, pathSet);
  console.timeLog("bootstrap", "All files: ", pathSet.size);

  await deduplicate(pathSet, md5ToFilePath);
  console.timeLog("bootstrap", "Map size: ", md5ToFilePath.size);

  const outputDirectory = await getOutputDirectory(source);
  await copyFile(md5ToFilePath, outputDirectory);
  console.timeEnd("bootstrap");
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
