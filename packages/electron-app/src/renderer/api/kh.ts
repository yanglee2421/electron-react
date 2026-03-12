import type { InsertRecordParams, SQLiteGetParams } from "#main/lib/ipc";
import { ipc } from "#renderer/shared/instances/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// 康华HMIS (安康)
const QUERY_KEY = "kh_hmis";

export const fetchKhRecord = (params: SQLiteGetParams) => {
  return queryOptions({
    queryKey: ["HMIS/kh_hmis_sqlite_get", params],
    queryFn: () => {
      return ipc.invoke("HMIS/kh_hmis_sqlite_get", params);
    },
  });
};

export const useDeleteKhRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/kh_hmis_sqlite_delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useInsertKhRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (_: InsertRecordParams) => {
      return ipc.invoke("HMIS/kh_hmis_sqlite_insert", _);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useFetchKhAxleInfo = () => {
  return useMutation({
    mutationFn: (barcode: string) => {
      return ipc.invoke("HMIS/kh_hmis_api_get", barcode);
    },
  });
};

export const useUploadAxleInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/kh_hmis_api_set", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
