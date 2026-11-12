import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { electronPlugin, reactDevtoolsPlugin } from "@yanglee2421/vp-plugin";
import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { defineConfig, normalizePath } from "vite-plus";

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

export default defineConfig({
  plugins: [
    react({ compiler: true }),
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
    reactDevtoolsPlugin(),
    electronPlugin(),
  ],
  resolve: { alias },
});
