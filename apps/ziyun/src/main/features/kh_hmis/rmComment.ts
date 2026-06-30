import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsContent = fs.readFileSync(
  path.resolve(__dirname, "./kh_hmis.ts"),
  "utf-8",
);

fs.writeFileSync(
  path.resolve(__dirname, "./kh_hmis_copy.ts"),
  tsContent.replaceAll(/\/\*[\s\S]*?\*\//g, ""),
  "utf-8",
);

console.log("finished");
