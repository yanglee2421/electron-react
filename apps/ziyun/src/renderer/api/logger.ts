import type { ListOptions } from "#main/features/logger/types";
import { useSubscribe } from "#renderer/hooks/useSubscribe";
import { ipc } from "#renderer/lib/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const QUERY_KEY = "logger";

export const fetchLog = (options: ListOptions) => {
  return queryOptions({
    queryKey: [QUERY_KEY, options],
    queryFn: () => {
      return ipc.invoke("logger/list", options);
    },
  });
};

export const useClearLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      return ipc.invoke("logger/clear");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};

export const useLogUpdate = () => {
  const queryClient = useQueryClient();

  useSubscribe("logUpdated", () => {
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  });
};

export const useDeleteLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("logger/delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
};
