import type { Rolldown } from "vite-plus";

export const workerPlugin = (): Rolldown.Plugin => {
  return {
    name: "worker-resolver",
    outputOptions(options) {
      options.codeSplitting = true;

      return options;
    },
    load: {
      filter: { id: /\?worker&url$/ },
      handler(id) {
        const workerFilePath = id.replace("?worker&url", "");
        const referenceId = this.emitFile({
          type: "chunk",
          id: workerFilePath,
        });

        return {
          code: `export default import.meta.ROLLDOWN_FILE_URL_${referenceId};`,
        };
      },
    },
  };
};
