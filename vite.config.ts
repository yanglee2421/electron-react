import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import renderer from "vite-plugin-electron-renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ReactCompilerConfig = {
  target: "19", // '17' | '18' | '19'
};

const htmlPlugin = () => ({
  name: "html-transform",
  transformIndexHtml: (html: string) => {
    if (process.env.NODE_ENV !== "development") {
      return (
        html
          /**
           * Remove the React DevTools script tag in production build.
           * This is a workaround for the issue that React DevTools script tag is not removed in production build.
           */
          .replace(/<script src="http:\/\/localhost:8097"><\/script>/, "")
          // Remove all empty lines in the HTML file.
          .replace(/^\s*[\r\n]/gm, "")
      );
    }

    return html;
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: "electron/main.ts",
        vite: {
          resolve: {
            alias: {
              "@": fileURLToPath(new URL("./src", import.meta.url)),
              "#": fileURLToPath(new URL("./", import.meta.url)),
            },
          },
          build: {
            rollupOptions: {
              external: ["better-sqlite3"],
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, "electron/preload.ts"),
        vite: {
          resolve: {
            alias: {
              "@": fileURLToPath(new URL("./src", import.meta.url)),
              "#": fileURLToPath(new URL("./", import.meta.url)),
            },
          },
          build: {
            rollupOptions: {
              output: {
                inlineDynamicImports: true,
              },
            },
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
    htmlPlugin(),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "#": fileURLToPath(new URL("./", import.meta.url)),
    },
  },

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
});
