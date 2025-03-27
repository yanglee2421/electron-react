import { ipcRenderer } from "@/lib/utils";
import { queryOptions } from "@tanstack/react-query";
import * as channel from "@electron/channel";
import type { GetDataFromAccessDatabaseParams } from "./fetcher_types";

export const fetchDetections = (params: GetDataFromAccessDatabaseParams) =>
  queryOptions({
    queryKey: [channel.getDataFromAccessDatabase, params],
    queryFn: async () => {
      const data: string = await ipcRenderer.invoke(
        channel.getDataFromAccessDatabase,
        params
      );

      return data;
    },
  });
