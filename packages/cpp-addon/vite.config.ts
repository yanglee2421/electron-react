import path from "node:path";
import url from "node:url";
import { defineConfig } from "vite-plus";

const calcualteJSExtension = (format: string) => {
  switch (format) {
    case "es":
      return ".mjs";
    case "cjs":
      return ".cjs";
    default:
      return ".js";
  }
};

const calcualteDTSExtension = (format: string) => {
  switch (format) {
    case "es":
      return ".d.mts";
    case "cjs":
      return ".d.cts";
    default:
      return ".d.ts";
  }
};

export default defineConfig(() => {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  return {
    pack: {
      entry: ["src/main.ts"],
      deps: {
        // onlyBundle: [],
        neverBundle: true,
      },

      outDir: path.resolve(__dirname, "dist"),
      outExtensions: ({ format }) => {
        return {
          js: calcualteJSExtension(format),
          dts: calcualteDTSExtension(format),
        };
      },
      format: "esm",
      platform: "node",
      target: "node24",
      dts: true,
      clean: true,
      fixedExtension: false,

      plugins: [],
    },
  };
});
