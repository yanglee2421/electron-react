import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pLimit from "p-limit";

const limit = pLimit(os.cpus().length);

export const ls = async (basePath: string): Promise<string[]> => {
  const stats = await fs.promises.stat(basePath);

  if (stats.isFile()) {
    return [basePath];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  const basenames = await fs.promises.readdir(basePath);
  const tasks = basenames.map((base) => {
    const subPath = path.resolve(basePath, base);

    return limit(() => ls(subPath));
  });

  const results = await Promise.all(tasks);

  return results.flat();
};