import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    // sortImports: {},
  },
  lint: {
    ignorePatterns: ["**/dist/**", "**/node_modules/**", "out", "release"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    plugins: ["eslint", "oxc", "typescript", "react"],
  },
});
