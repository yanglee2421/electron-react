import { ipc } from "#renderer/lib/ipc";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const QUERY_KEY = "jtv_hmis";

export const fetchJtvHmisSqliteGet = (payload: SQLiteGetParams) =>
  queryOptions({
    queryKey: [QUERY_KEY, payload],
    queryFn: () => {
      return ipc.invoke("HMIS/jtv_hmis_sqlite_get", payload);
    },
  });

export const useDeleteJTVRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/jtv_hmis_sqlite_delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useInsertJTVRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InsertRecordParams) => {
      return ipc.invoke("HMIS/jtv_hmis_sqlite_insert", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

type JTVZHGetPayload = {
  barcode: string;
  isZhMode: boolean;
};

export const useFetchAxleInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ barcode, isZhMode }: JTVZHGetPayload) => {
      return ipc.invoke("HMIS/jtv_hmis_api_get", barcode, isZhMode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadAxleInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("HMIS/jtv_hmis_api_set", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
