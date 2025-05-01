import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import renderer from "vite-plugin-electron-renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const alias = {
  "@": fileURLToPath(new URL("./src/renderer", import.meta.url)),
  "#": fileURLToPath(new URL("./src/main", import.meta.url)),
  "~": fileURLToPath(new URL("./src/preload", import.meta.url)),
};

const ReactCompilerConfig = {
  // '17' | '18' | '19'
  target: "19",
};

/**
 * @description
 * Vite plugin to remove the React DevTools script tag in production build.
 *
 *
 * This is a workaround for the issue that React DevTools script tag is not removed in production build.
 *
 *
 * Remove all empty lines in the HTML file.
 */
const htmlPlugin = (isBuild: boolean) => ({
  name: "html-transform",
  transformIndexHtml: (html: string) => {
    if (!isBuild) {
      return html;
    }
    return html
      .replace(/<script src="http:\/\/localhost:8097"><\/script>/, "")
      .replace(/^\s*[\r\n]/gm, "");
  },
});

// https://vitejs.dev/config/
export default defineConfig((config) => ({
  plugins: [
    react({
      babel: {
        /**
         * Enable react compiler for React 19.
         */
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: path.join(__dirname, "src/main/main.ts"),
        vite: {
          resolve: { alias },
          build: {
            rollupOptions: {
              /**
               * Below packages not need to be bundled by Vite.
               * 1. `better-sqlite3` is a native module, it needs to be compiled by `electron-rebuild`.
               * 2. `electron/main` and `electron/common` are Electron modules, they are not needed to be bundled by Vite.
               */
              external: ["better-sqlite3", "electron/main", "electron/common"],
            },
            /**
             * In main process, the `chunkSizeWarningLimit` is set to 10MB.
             * This is because the main process do not need to load JS by network,
             * and the main process is not a web page, so the `chunkSizeWarningLimit` is set to 10MB.
             */
            chunkSizeWarningLimit: 1024 * 10,
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, "src/preload/main.ts"),
        vite: {
          resolve: { alias },
          build: {
            rollupOptions: {
              /**
               * Below packages not need to be bundled by Vite.
               */
              external: ["electron/renderer"],
              output: {
                /**
                 * Ensure that the preload script is single bundle.
                 */
                inlineDynamicImports: true,
                entryFileNames: "preload.mjs",
              },
            },

            chunkSizeWarningLimit: 500,
          },
        },
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer:
        process.env.NODE_ENV === "test"
          ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
            void 0
          : {},
    }),
    renderer(),
    htmlPlugin(config.command === "build"),
  ],

  resolve: { alias },

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "react-dom";
          }
          if (
            id.includes("node_modules/@tanstack/react-query/") ||
            id.includes(
              "node_modules/@tanstack/@tanstack/react-query-devtools/",
            )
          ) {
            return "tanstack-react-query";
          }
          if (
            id.includes("node_modules/react-hook-form/") ||
            id.includes("node_modules/@hookform/resolvers/") ||
            id.includes("node_modules/zod/")
          ) {
            return "react-hook-form";
          }
          if (id.includes("node_modules/zustand/")) {
            return "zustand";
          }
          if (id.includes("node_modules/notistack/")) {
            return "notistack";
          }
          if (
            id.includes("node_modules/dexie/") ||
            id.includes("node_modules/dexie-react-hooks/")
          ) {
            return "dexie";
          }
          if (id.includes("node_modules/qrcode.react/")) {
            return "qrcode.react";
          }
        },
      },
    },
  },
}));
