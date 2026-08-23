import path from "node:path";
import type { Plugin } from "rolldown";
import { rolldown } from "rolldown";

export const workerUrlPlugin = (): Plugin => {
  const workerSuffix = "?worker&url";

  return {
    name: "resolver-worker-url",
    resolveId: {
      filter: {
        id: /\?worker&url$/,
      },
      handler(source, importer) {
        const cleanSource = source.slice(0, -workerSuffix.length);
        const absolutePath = importer
          ? path.resolve(path.dirname(importer), cleanSource)
          : path.resolve(cleanSource);

        console.log(source);
        console.log(cleanSource);
        console.log(absolutePath);

        return `${absolutePath}?worker-url-virtual`;
      },
    },

    load: {
      filter: {
        id: /\?worker-url-virtual$/,
      },
      async handler(id) {
        const workerFilePath = id.replace("?worker-url-virtual", "");
        const bundle = await rolldown({ input: workerFilePath });
        const { output } = await bundle.generate({ format: "esm" });
        const workerChunk = output.find((chunk) => chunk.type === "chunk")!;
        const referenceId = this.emitFile({
          type: "asset",
          source: workerChunk.code,
          name: workerChunk.name + ".js",
        });

        return {
          code: `export default import.meta.ROLLUP_FILE_URL_${referenceId};`,
          map: null,
        };
      },
    },
  };
};
