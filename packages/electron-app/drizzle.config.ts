import url from "node:url";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  out: "./drizzle",
  schema: "./src/main/schema.ts",
  dialect: "sqlite",
  // Dynamic database path for Electron
  dbCredentials: {
    url: `file:${path.join(__dirname, "db.db")}`,
  },
});
