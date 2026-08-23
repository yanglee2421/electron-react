import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { vitePluginElectron } from "@yanglee2421/vite-plugin";
import path from "node:path";
import url from "node:url";
import { defineConfig } from "vite";

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
    vitePluginElectron(),
  ],
  build: {
    outDir: path.resolve(__dirname, "./out/renderer"),
    emptyOutDir: true,
  },
  resolve: { alias },
});
