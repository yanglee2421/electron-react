import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "rolldown";

export const png = (): Plugin => {
  return {
    name: "rolldown:png",
    load: {
      filter: { id: /\.png$/ },
      handler(id) {
        const referenceId = this.emitFile({
          type: "asset",
          name: path.basename(id),
          source: fs.readFileSync(id),
        });

        return {
          code: `export default import.meta.ROLLDOWN_FILE_URL_${referenceId};`,
          map: null,
        };
      },
    },
  };
};
