import { ipc } from "#renderer/lib/ipc";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// 康华HMIS (安康)
const QUERY_KEY = "kh_hmis";

export const fetchKhRecord = (params: SQLiteGetParams) => {
  return queryOptions({
    queryKey: [QUERY_KEY, params],
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (barcode: string) => {
      return ipc.invoke("HMIS/kh_hmis_api_get", barcode);
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
      return ipc.invoke("HMIS/kh_hmis_api_set", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadCHR501 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return ipc.invoke("HMIS/kh_hmis_chr501", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadCHR502 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => {
      return ipc.invoke("HMIS/kh_hmis_chr502", ids);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadCHR503 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return ipc.invoke("HMIS/kh_hmis_chr503", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
