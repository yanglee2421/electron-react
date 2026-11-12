import fs from "node:fs";
import path from "node:path";
import type { Rolldown } from "vite-plus";

export const assetsPlugin = (): Rolldown.Plugin => {
  return {
    name: "resolver-assets",
    load: {
      filter: { id: [/\.png$/, /\.svg$/, /\.jpe?g$/] },
      handler(id) {
        const referenceId = this.emitFile({
          type: "asset",
          name: path.basename(id),
          source: fs.readFileSync(id),
        });

        return {
          code: `export default import.meta.ROLLDOWN_FILE_URL_${referenceId};`,
        };
      },
    },
  };
};
