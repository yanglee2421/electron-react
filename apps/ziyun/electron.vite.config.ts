import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
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

const alias = {
  "#main": url.fileURLToPath(new URL("./src/main", import.meta.url)),
  "#preload": url.fileURLToPath(new URL("./src/preload", import.meta.url)),
  "#renderer": url.fileURLToPath(new URL("./src/renderer", import.meta.url)),
  "#resources": url.fileURLToPath(new URL("./resources", import.meta.url)),
  "#shared": url.fileURLToPath(new URL("./src/shared", import.meta.url)),
};

export default defineConfig({
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
        output: {
          format: "cjs" as const,
        },
      },
      externalizeDeps: false,
    },
  },
  renderer: {
    plugins: [
      react(),
      reactDevtoolsPlugin(),
      babel({ presets: [reactCompilerPreset({ target: "19" })] }),
    ],
    resolve: { alias },
    build: {},
  },
});
