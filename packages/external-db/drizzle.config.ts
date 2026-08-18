import { defineConfig } from "drizzle-kit";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default defineConfig({
  schema: "./src/schema.ts",
  out: path.resolve(__dirname, "../../apps/ziyun/drizzle/qt"),
  dialect: "sqlite",
  dbCredentials: {
    url: "D:\\qtapp\\data\\local.db",
  },
});
