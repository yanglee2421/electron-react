import { ipcRenderer } from "@/lib/utils";
import { queryOptions } from "@tanstack/react-query";
import * as channel from "@electron/channel";
import type {
  GetDataFromAccessDatabaseParams,
  Detection,
} from "@/api/database_types";

export const fetchDetections = (params: GetDataFromAccessDatabaseParams) =>
  queryOptions({
    queryKey: [channel.getDataFromAccessDatabase, params],
    queryFn: async () => {
      const data: Detection[] = await ipcRenderer.invoke(
        channel.getDataFromAccessDatabase,
        params
      );

      return data;
    },
  });
