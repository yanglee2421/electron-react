import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { electron } from "@yanglee2421/vite-plugin";
import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import type { Plugin } from "vite-plus";
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

const electronPlugin = (): Plugin[] => {
  return [
    {
      name: "electron:dev",
      apply: "serve",
      config() {
        return {
          server: {
            watch: {
              ignored: [
                "**/out/**",
                "**/release/**",
                "**/src/main/**",
                "**/src/preload/**",
              ],
            },
          },
        };
      },
      configResolved() {},
      configureServer() {},
      closeServer() {},
    },
  ];
};

export default defineConfig({
  plugins: [
    react() as unknown as Plugin,
    babel({ presets: [reactCompilerPreset()] }) as unknown as Plugin,
    tailwindcss() as unknown as Plugin,
    viteStaticCopy({
      targets: [
        {
          src: cMapsDir,
          dest: "cmaps",
          rename: { stripBase: true },
        },
      ],
    }) as unknown as Plugin,
    electron() as unknown as Plugin,
    electronPlugin(),
  ],
  resolve: { alias },
});
