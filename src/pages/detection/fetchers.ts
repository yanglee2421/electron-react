import { queryOptions } from "@tanstack/react-query";
import type {
  GetDataFromAccessDatabaseParams,
  Detection,
} from "#/electron/database_types";

export const fetchDetections = (params: GetDataFromAccessDatabaseParams) =>
  queryOptions({
    queryKey: ["window.electronAPI.getDataFromAccessDatabase", params],
    queryFn: async () => {
      const data =
        await window.electronAPI.getDataFromAccessDatabase<Detection>(params);

      return data;
    },
  });
