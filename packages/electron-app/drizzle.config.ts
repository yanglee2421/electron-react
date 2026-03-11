import { defineConfig } from "drizzle-kit";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  out: "./drizzle",
  schema: "./src/main/db/schema.ts",
  dialect: "sqlite",
  // Dynamic database path for Electron
  dbCredentials: {
    url: `file:${path.join(__dirname, "db.db")}`,
  },
});
