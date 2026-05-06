import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    plugins: ["eslint", "oxc", "typescript"],
    rules: {
      "typescript/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
    },
    overrides: [
      {
        files: [
          "packages/electron-app/src/renderer/**/*.ts",
          "packages/electron-app/src/renderer/**/*.tsx",
        ],
        plugins: ["eslint", "oxc", "typescript", "react", "react-perf"],
      },
    ],
    ignorePatterns: [],
  },
});
