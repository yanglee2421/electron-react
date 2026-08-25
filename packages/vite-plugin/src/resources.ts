import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import type { ExternalOption, Plugin } from "rolldown";
import { build } from "rolldown";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shimFile = path.resolve(__dirname, "esm-shims.ts");

interface ResourcesInput {
  external: ExternalOption;
}

export const resources = (input: ResourcesInput): Plugin[] => {
  return [
    {
      name: "resolver-worker",
      load: {
        filter: { id: /\?worker&url$/ },
        async handler(id) {
          const workerFilePath = id.replace("?worker&url", "");
          const { output } = await build({
            write: false,
            input: workerFilePath,
            output: {
              format: "esm",
              codeSplitting: false,
            },
            platform: "node",
            external: input.external,
            transform: {
              inject: {
                __dirname: [shimFile, "__dirname"],
                __filename: [shimFile, "__filename"],
              },
            },
          });
          const [workerChunk] = output;
          const referenceId = this.emitFile({
            type: "asset",
            source: workerChunk.code,
            name: workerChunk.name + ".js",
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
