import type { InsertRecordParams, SQLiteGetParams } from "#main/lib/ipc";
import { ipc } from "#renderer/shared/instances/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const QUERY_KEY = "guangzhouJibaoduanRecord";

export const fetchGuangzhouJibaoduanRecord = (_: SQLiteGetParams) => {
  return queryOptions({
    queryKey: [QUERY_KEY],
    queryFn: () => {
      return ipc.invoke("hmis_guangzhoujibaoduan/get_record", _);
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
    mutationFn: ({
      barcode,
      isZhMode,
    }: {
      barcode: string;
      isZhMode?: boolean;
    }) => {
      return ipc.invoke(
        "hmis_guangzhoujibaoduan/fetch_axle_info",
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
