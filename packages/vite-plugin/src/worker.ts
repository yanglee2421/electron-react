import type { Plugin } from "rolldown";
import { rolldown } from "rolldown";

export const worker = (): Plugin => {
  return {
    name: "resolver-worker",
    load: {
      filter: {
        id: /\?worker&url$/,
      },
      async handler(id) {
        const workerFilePath = id.replace("?worker&url", "");
        const bundle = await rolldown({
          input: workerFilePath,
          platform: "node",
          external: [
            "electron",
            "@yanglee2421/cpp-addon",
            "fast-xml-parser",
            "pdf-parse",
            "pdf-parse/worker",
            "pdfjs-dist",
            "piscina",
            "serialport",
          ],
        });
        const { output } = await bundle.generate({
          format: "esm",
          codeSplitting: false,
        });
        const workerChunk = output.find((chunk) => chunk.type === "chunk")!;
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
  };
};
