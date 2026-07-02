import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import path from "node:path";
import url from "node:url";
import type { Plugin } from "vite";

const reactDevtoolsPlugin = (enabled?: boolean): Plugin => {
  return {
    name: "vite-plugin-react-devtools-injector",
    transformIndexHtml: () => {
      if (!enabled) return;

      return [
        {
          tag: "script",
          attrs: { src: "http://localhost:8097" },
          injectTo: "head-prepend",
        },
      ];
    },
    apply: "serve",
  };
};

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const alias = {
  "#main": path.resolve(__dirname, "./src/main"),
  "#preload": path.resolve(__dirname, "./src/preload"),
  "#renderer": path.resolve(__dirname, "./src/renderer"),
  "#resources": path.resolve(__dirname, "./resources"),
  "#shared": path.resolve(__dirname, "./src/shared"),
};

export default defineConfig(async () => {
  /**
   * electron-vite use deepClone resolve vite configs
   * And promise can not be deepCloned
   * So need await it to get plain object
   */
  const babelPlugin = await babel({
    presets: [reactCompilerPreset({ target: "19" })],
  });

  return {
    main: {
      resolve: { alias },
      build: {
        watch: {},
        rolldownOptions: {
          treeshake: false,
        },
      },
    },
    preload: {
      resolve: { alias },
      build: {
        rolldownOptions: {
          output: { format: "cjs" as const },
        },
        externalizeDeps: false,
      },
    },
    renderer: {
      plugins: [react(), reactDevtoolsPlugin(), babelPlugin],
      resolve: { alias },
      build: {},
    },
  };
});
