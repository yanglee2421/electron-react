import { queryOptions } from "@tanstack/react-query";
import type { Detection } from "#/electron/cmd";

export const fetchDetections = (sql: string) =>
  queryOptions({
    queryKey: ["window.electronAPI.getDataFromAccessDatabase", sql],
    queryFn: async () => {
      const data =
        await window.electronAPI.getDataFromAccessDatabase<Detection>(sql);

      return data;
    },
  });
