import module from "node:module";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const require = module.createRequire(import.meta.url);

export const cmakeAddon = require(
  path.join(__dirname, "../build/Release/cmake-addon.node"),
);

console.log(cmakeAddon);
