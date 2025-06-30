import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";

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

export default defineConfig((config) => ({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias },
    build: { watch: {} },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
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
  },
}));
