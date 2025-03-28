import { queryOptions, useMutation } from "@tanstack/react-query";
import type {
  GetDataFromAccessDatabaseParams,
  Verify,
} from "@/api/database_types";
import type { UploadVerifiesParams } from "#/electron/hxzy_hmis";

export const fetchVerifies = (params: GetDataFromAccessDatabaseParams) =>
  queryOptions({
    queryKey: ["window.electronAPI.getDataFromAccessDatabase", params],
    queryFn: async () => {
      const data = await window.electronAPI.getDataFromAccessDatabase<Verify>(
        params
      );

      return data;
    },
  });

export const useUploadVerifies = () => {
  return useMutation({
    mutationFn: async (params: UploadVerifiesParams) => {
      const data = await window.electronAPI.hxzy_hmis_upload_verifies(params);
      return data;
    },
  });
};
