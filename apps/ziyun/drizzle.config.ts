import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle/db",
  schema: "./src/main/features/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "C:\\Users\\lee\\AppData\\Roaming\\app-ziyun-dev\\db.db",
  },
});
