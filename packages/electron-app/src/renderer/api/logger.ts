import type { ListOptions } from "#main/shared/factories/Logger";
import { ipc } from "#renderer/shared/instances/ipc";
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
