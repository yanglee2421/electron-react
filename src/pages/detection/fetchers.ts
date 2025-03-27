import { ipcRenderer } from "@/lib/utils";
import { queryOptions, useMutation } from "@tanstack/react-query";
import * as channel from "@electron/channel";
import { useIndexedStore } from "@/hooks/useIndexedStore";
import type {
  GetDataFromAccessDatabaseParams,
  Detection,
  UploadByIdParams,
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

export const useUploadById = () => {
  const settings = useIndexedStore((s) => s.settings);

  return useMutation({
    async mutationFn(id: string) {
      const params: UploadByIdParams = {
        driverPath: settings.driverPath,
        databasePath: settings.databasePath,
        id,
      };

      const data = ipcRenderer.invoke(channel.uploadToHXZYById, params);
      return data;
    },
  });
};
