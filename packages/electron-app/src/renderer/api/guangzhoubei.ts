import type { InsertRecordParams, SQLiteGetParams } from "#main/lib/ipc";
import { ipc } from "#renderer/shared/instances/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

type JTVZHGetPayload = {
  barcode: string;
  isZhMode?: boolean;
};

const QUERY_KEY = "jtv_hmis_guangzhoubei";

export const fetchGuangzhoubeiRecord = (payload: SQLiteGetParams) => {
  return queryOptions({
    queryKey: [QUERY_KEY, payload],
    queryFn: () => {
      return ipc.invoke("HMIS/jtv_hmis_guangzhoubei_sqlite_get", payload);
    },
  });
};

export const useDeleteGuangzhoubeiRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/jtv_hmis_guangzhoubei_sqlite_delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useInsertGuangzhoubeiRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InsertRecordParams) => {
      return ipc.invoke("HMIS/jtv_hmis_guangzhoubei_sqlite_insert", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useFetchGuangzhoubeiRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ barcode, isZhMode }: JTVZHGetPayload) => {
      return ipc.invoke(
        "HMIS/jtv_hmis_guangzhoubei_api_get",
        barcode,
        isZhMode,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadGuangzhoubeiAxleInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/jtv_hmis_guangzhoubei_api_set", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
