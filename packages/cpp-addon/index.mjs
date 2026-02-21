import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const addon = require("./build/Release/hello_addon.node");
export default addon;
