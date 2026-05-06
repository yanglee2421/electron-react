import type { InsertRecordParams } from "#main/shared/factories/hmis/xuzhoubei";
import { ipc } from "#renderer/lib/ipc";
import type { SQLiteGetParams } from "#shared/types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// 京天威HMIS (徐州北)
const QUERY_KEY = "jtv_hmis_xuzhoubei";

export const fetchXuzhoubeiRecord = (params: SQLiteGetParams) =>
  queryOptions({
    queryKey: [QUERY_KEY, params],
    queryFn: () => {
      return ipc.invoke("HMIS/jtv_hmis_xuzhoubei_sqlite_get", params);
    },
  });

export const useDeleteXuzhoubeiRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/jtv_hmis_xuzhoubei_sqlite_delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useInsertXuzhoubeiRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: InsertRecordParams) => {
      return ipc.invoke("HMIS/jtv_hmis_xuzhoubei_sqlite_insert", params);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useFetchXuzhoubeiAxleInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (barcode: string) => {
      return ipc.invoke("HMIS/jtv_hmis_xuzhoubei_api_get", barcode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadXuzhoubeiAxleInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/jtv_hmis_xuzhoubei_api_set", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
