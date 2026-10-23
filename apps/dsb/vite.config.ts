import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { electron } from "@yanglee2421/vite-plugin";
import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";
import { defineConfig, normalizePath } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const require = createRequire(import.meta.url);
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const alias = {
  "#main": path.resolve(__dirname, "./src/main"),
  "#preload": path.resolve(__dirname, "./src/preload"),
  "#renderer": path.resolve(__dirname, "./src/renderer"),
  "#resources": path.resolve(__dirname, "./resources"),
  "#shared": path.resolve(__dirname, "./src/shared"),
};
const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"));
const cMapsDir = normalizePath(path.join(pdfjsDistPath, "cmaps"));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: cMapsDir,
          dest: "cmaps",
          rename: { stripBase: true },
        },
      ],
    }),
    electron(),
  ],
  resolve: { alias },
});
