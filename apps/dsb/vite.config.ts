import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import path from "node:path";
import url from "node:url";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import { esmShim } from "vite-plugin-electron/plugin";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const alias = {
  "#main": path.resolve(__dirname, "./src/main"),
  "#preload": path.resolve(__dirname, "./src/preload"),
  "#renderer": path.resolve(__dirname, "./src/renderer"),
  "#resources": path.resolve(__dirname, "./resources"),
  "#shared": path.resolve(__dirname, "./src/shared"),
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    electron([
      {
        vite: {
          plugins: [esmShim()],
          build: {
            outDir: "out/main",
            emptyOutDir: true,
            rolldownOptions: {
              output: {
                entryFileNames: "index.js",
              },
              external: ["electron"],
            },
            lib: {
              entry: path.resolve(__dirname, "src/main/index.ts"),
              formats: ["es"],
            },
          },
          resolve: { alias },
        },
        onstart(args) {
          args.startup();
        },
      },
      {
        vite: {
          build: {
            outDir: "out/preload",
            emptyOutDir: true,
            rolldownOptions: {
              output: {
                entryFileNames: "index.cjs",
                codeSplitting: false,
              },
              external: ["electron"],
            },
            lib: {
              entry: path.resolve(__dirname, "src/preload/index.ts"),
              formats: ["cjs"],
            },
          },
          resolve: { alias },
        },
        onstart(args) {
          // Notify the Renderer process to reload the page when the Preload scripts build is complete,
          // instead of restarting the entire Electron App.
          args.reload();
        },
      },
    ]),
  ],
  build: {
    outDir: path.resolve(__dirname, "./out/renderer"),
    emptyOutDir: true,
  },
  resolve: { alias },
});
