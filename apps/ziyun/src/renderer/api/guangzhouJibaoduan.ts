import { ipc } from "#renderer/lib/ipc";
import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const QUERY_KEY = "guangzhouJibaoduanRecord";

export const fetchGuangzhouJibaoduanRecord = (params: SQLiteGetParams) => {
  return queryOptions({
    queryKey: [QUERY_KEY, params],
    queryFn: () => {
      return ipc.invoke("hmis_guangzhoujibaoduan/get_record", params);
    },
  });
};

export const useDeleteGuangzhoujibaoduanRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("hmis_guangzhoujibaoduan/delete_record", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useInsertGuangzhouJibaoduanRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: InsertRecordParams) => {
      return ipc.invoke("hmis_guangzhoujibaoduan/insert_record", params);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useFetchGuangzhouJibaoduanAxle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ barcode }: { barcode: string }) => {
      return ipc.invoke("hmis_guangzhoujibaoduan/fetch_axle_info", barcode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadGuangzhouJibaoduanData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("hmis_guangzhoujibaoduan/upload_data", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
