import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import workerThreads from "node:worker_threads";
import pLimit from "p-limit";

const computeMD5 = (filePath: string) => {
  const hash = crypto.createHash("md5");
  const stream = fs.createReadStream(filePath);

  return new Promise<string>((resolve, reject) => {
    stream.on("error", reject);
    stream.on("data", (chunk) => {
      hash.update(chunk);
    });
    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
};

interface WrokerData {
  files: string[];
}

export const resolveFiles = async (workerData: WrokerData) => {
  const { files }: WrokerData = workerData;
  const md5ToFile = new Map<string, string>();
  const limit = pLimit(os.cpus().length);

  await Promise.all(
    files.map((file) => {
      return limit(async () => {
        const md5 = await computeMD5(file);
        md5ToFile.set(md5, file);
      });
    }),
  );

  return Object.fromEntries(md5ToFile.entries());
};

export default resolveFiles;

export const bootstrap = async () => {
  const data: WrokerData = workerThreads.workerData;
  const result = await resolveFiles(data);

  workerThreads.parentPort?.postMessage(result);
};
