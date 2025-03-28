import { ipcRenderer } from "@/lib/utils";
import { queryOptions, useMutation } from "@tanstack/react-query";
import * as channel from "@electron/channel";
import type {
  GetDataFromAccessDatabaseParams,
  Verify,
} from "@/api/database_types";
import type { UploadVerifiesParams } from "@electron/hxzy_hmis";

export const fetchVerifies = (params: GetDataFromAccessDatabaseParams) =>
  queryOptions({
    queryKey: [channel.getDataFromAccessDatabase, params],
    queryFn: async () => {
      const data: Verify[] = await ipcRenderer.invoke(
        channel.getDataFromAccessDatabase,
        params
      );

      return data;
    },
  });

export const useUploadVerifies = () => {
  return useMutation({
    mutationFn: async (params: UploadVerifiesParams) => {
      const data = await ipcRenderer.invoke(
        channel.hxzy_hmis_upload_verifies,
        params
      );

      return data;
    },
  });
};
