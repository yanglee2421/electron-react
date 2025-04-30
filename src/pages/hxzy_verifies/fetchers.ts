import { queryOptions, useMutation } from "@tanstack/react-query";
import type { Verify } from "#/backend/cmd";

export const fetchVerifies = (sql: string) =>
  queryOptions({
    queryKey: ["window.electronAPI.getDataFromAccessDatabase", sql],
    queryFn: async () => {
      const data =
        await window.electronAPI.getDataFromAccessDatabase<Verify>(sql);

      return data;
    },
  });

export const useUploadVerifies = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await window.electronAPI.hxzy_hmis_api_verifies(id);
      return data;
    },
  });
};
