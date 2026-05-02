import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import url from "node:url";
import type { Plugin } from "vite";

const alias = {
  "#main": url.fileURLToPath(new URL("./src/main", import.meta.url)),
  "#preload": url.fileURLToPath(new URL("./src/preload", import.meta.url)),
  "#renderer": url.fileURLToPath(new URL("./src/renderer", import.meta.url)),
  "#resources": url.fileURLToPath(new URL("./resources", import.meta.url)),
  "#shared": url.fileURLToPath(new URL("./src/shared", import.meta.url)),
};

const ReactCompilerConfig = {
  // '17' | '18' | '19'
  target: "19",
};

const reactDevtoolsPlugin = (): Plugin => {
  return {
    name: "vite-plugin-react-devtools-injector",
    transformIndexHtml: () => [
      {
        tag: "script",
        attrs: { src: "http://localhost:8097" },
        injectTo: "head-prepend",
      },
    ],
    apply: "serve",
  };
};

export default defineConfig((config) => ({
  main: {
    resolve: { alias },
    build: { watch: {} },
  },
  preload: {
    resolve: { alias },
  },
  renderer: {
    plugins: [
      react({
        babel: {
          /**
           * Enable react compiler for React 19.
           */
          plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
        },
      }),
      reactDevtoolsPlugin(),
    ],
    resolve: { alias },
    build: {},
  },
}));
