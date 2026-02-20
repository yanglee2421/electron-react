import * as fs from "node:fs";
import * as crypto from "node:crypto";
import * as workerThreads from "node:worker_threads";

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

type WrokerData = {
  files: string[];
};

const bootstrap = async () => {
  const { files }: WrokerData = workerThreads.workerData;
  const md5ToFile = new Map<string, string>();

  for (const file of files) {
    const md5 = await computeMD5(file);
    md5ToFile.set(md5, file);
  }

  workerThreads.parentPort?.postMessage(
    Object.fromEntries(md5ToFile.entries()),
  );
};

bootstrap();
