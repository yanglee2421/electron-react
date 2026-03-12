import type { InsertRecordParams, SQLiteGetParams } from "#main/lib/ipc";
import { ipc } from "#renderer/shared/instances/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const QUERY_KEY = "hxzy_hmis_record";

// 华兴致远HMIS (成都北)
export const fetchHxzyRecord = (params: SQLiteGetParams) =>
  queryOptions({
    queryKey: [QUERY_KEY, params],
    queryFn: () => {
      return ipc.invoke("HMIS/hxzy_hmis_sqlite_get", params);
    },
  });

export const useDeleteHxzyRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/hxzy_hmis_sqlite_delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useInsertHxzyRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: InsertRecordParams) => {
      return ipc.invoke("HMIS/hxzy_hmis_sqlite_insert", params);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useFetchAxleInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (barcode: string) => {
      return ipc.invoke("HMIS/hxzy_hmis_api_get", barcode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadDetecion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/hxzy_hmis_api_set", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
