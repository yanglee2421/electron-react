import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "rolldown";

export const resources = (): Plugin[] => {
  return [
    {
      name: "resolver-worker",
      outputOptions(options) {
        if (!options.codeSplitting) {
          console.warn(
            "When use worker plugin the options codeSplitting will force to set true",
          );
        }

        return {
          codeSplitting: true,
        };
      },
      load: {
        filter: { id: /\?worker&url$/ },
        async handler(id) {
          const workerFilePath = id.replace("?worker&url", "");
          // const { output } = await build({
          //   write: false,
          //   input: workerFilePath,
          //   output: {
          //     format: "esm",
          //     codeSplitting: false,
          //   },
          //   platform: "node",
          //   external: input.external,
          //   transform: {
          //     inject: {
          //       __dirname: [shimFile, "__dirname"],
          //       __filename: [shimFile, "__filename"],
          //     },
          //   },
          // });
          // const [workerChunk] = output;
          // const referenceId = this.emitFile({
          //   type: "asset",
          //   source: workerChunk.code,
          //   name: workerChunk.name + ".js",
          // });
          const referenceId = this.emitFile({
            type: "chunk",
            id: workerFilePath,
          });

          return {
            code: `export default import.meta.ROLLDOWN_FILE_URL_${referenceId};`,
            map: null,
          };
        },
      },
    },
    {
      name: "resolver-assets",
      load: {
        filter: { id: [/\.png$/, /\.svg$/, /\.jpe?g$/] },
        handler(id) {
          const referenceId = this.emitFile({
            type: "asset",
            name: path.basename(id),
            source: fs.readFileSync(id),
          });

          return {
            code: `export default import.meta.ROLLDOWN_FILE_URL_${referenceId};`,
            map: null,
          };
        },
      },
    },
  ];
};
