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
          "apps/dsb/src/renderer/**/*.ts",
          "apps/dsb/src/renderer/**/*.tsx",
          "apps/ziyun/src/renderer/**/*.ts",
          "apps/ziyun/src/renderer/**/*.tsx",
        ],
        plugins: ["eslint", "oxc", "typescript", "react", "react-perf"],
      },
    ],
    ignorePatterns: [],
  },
});
