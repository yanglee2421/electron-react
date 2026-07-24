import { ipc } from "#renderer/lib/ipc";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const QUERY_KEY = "guangzhoucheliang";

export const useScanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (barcode: string) => {
      return ipc.invoke("guangzhoucheliang/scanner", barcode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("guangzhoucheliang/upload", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useBarcodeDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("guangzhoucheliang/barcode/delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useBarcodeInsert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InsertRecordParams) => {
      return ipc.invoke("guangzhoucheliang/barcode/insert", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const fetchBarcode = (payload: SQLiteGetParams) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "guangzhoucheliang/barcode/read", payload],
    queryFn: async () => {
      return ipc.invoke("guangzhoucheliang/barcode/read", payload);
    },
  });
};