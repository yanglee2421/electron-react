import * as fs from "node:fs";
import * as path from "node:path";
import pLimit from "p-limit";

export const ls = async (basePath: string): Promise<string[]> => {
  const stats = await fs.promises.stat(basePath);

  if (stats.isFile()) {
    return [basePath];
  }

  if (stats.isDirectory()) {
    const basenames = await fs.promises.readdir(basePath);
    const limit = pLimit(1000);

    const tasks = basenames.map((basename) => {
      const subPath = path.resolve(basePath, basename);

      return limit(() => ls(subPath));
    });

    const results = await Promise.all(tasks);

    return results.flat();
  }

  return [];
};
