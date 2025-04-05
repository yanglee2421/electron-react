import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./electron/schema.ts",
  dialect: "sqlite",
  // Dynamic database path for Electron
  // dbCredentials: {
  //   url: process.env.DB_FILE_NAME!,
  // },
});
