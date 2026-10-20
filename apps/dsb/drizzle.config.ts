import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/main/ioc/app-db/schema.ts",
  dialect: "sqlite",
  // Dynamic database path for Electron
  dbCredentials: {
    url: "C:\\Users\\lee\\AppData\\Roaming\\app-dsb\\db.db",
  },
});
