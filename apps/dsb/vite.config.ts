import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "node:path";
import url from "node:url";
import { defineConfig } from "vite";
import { VitePluginDoubleshot } from "vite-plugin-doubleshot";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePluginDoubleshot({
      type: "electron",
      main: path.resolve(__dirname, "./out/main/index.js"),
      entry: path.resolve(__dirname, "./src/main/index.ts"),
      outDir: path.resolve(__dirname, "./out/main"),
      tsdownConfig: {
        format: "esm",
        outExtensions: () => ({ js: ".js" }),
        shims: true,
        deps: {
          neverBundle: ["electron"],
        },
        clean: true,
        alias: {
          "#main": path.resolve(__dirname, "./src/main"),
          "#preload": path.resolve(__dirname, "./src/preload"),
          "#renderer": path.resolve(__dirname, "./src/renderer"),
          "#resources": path.resolve(__dirname, "./resources"),
          "#shared": path.resolve(__dirname, "./src/shared"),
        },
      },
      electron: {
        preload: {
          entry: path.resolve(__dirname, "./src/preload/index.ts"),
          outDir: path.resolve(__dirname, "./out/preload"),
          tsdownConfig: {
            format: "cjs",
            outExtensions: () => ({ js: ".cjs" }),
            shims: true,
            deps: {
              neverBundle: ["electron"],
            },
            clean: true,
            alias: {
              "#main": path.resolve(__dirname, "./src/main"),
              "#preload": path.resolve(__dirname, "./src/preload"),
              "#renderer": path.resolve(__dirname, "./src/renderer"),
              "#resources": path.resolve(__dirname, "./resources"),
              "#shared": path.resolve(__dirname, "./src/shared"),
            },
          },
        },
        build: {
          config: path.resolve(__dirname, "./electron-builder.ts"),
        },
      },
    }),
  ],
  root: path.resolve(__dirname, "./src/renderer"),
  build: {
    outDir: path.resolve(__dirname, "./out/renderer"),
    emptyOutDir: true,
  },
  base: "./",
  resolve: {
    alias: {
      "#main": path.resolve(__dirname, "./src/main"),
      "#preload": path.resolve(__dirname, "./src/preload"),
      "#renderer": path.resolve(__dirname, "./src/renderer"),
      "#resources": path.resolve(__dirname, "./resources"),
      "#shared": path.resolve(__dirname, "./src/shared"),
    },
  },
});
