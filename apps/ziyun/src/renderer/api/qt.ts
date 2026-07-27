import type { SetupAppInput } from "#main/features/qt/types";
import { ipc } from "#renderer/lib/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

const QUERY_KEY = "qt";

export const fetchExternalDBAnniversary = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/anniversary"],
    queryFn: async () => {
      return ipc.invoke("qt/anniversary");
    },
  });
};

export const fetchExternalDBAnniversaryDetail = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/anniversary-detail", id],
    queryFn: async () => {
      return ipc.invoke("qt/anniversary-detail", id);
    },
  });
};

export const fetchExternalDB503 = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/503", id],
    queryFn: () => {
      return ipc.invoke("qt/503", id);
    },
  });
};

export const fetchExternalDB501 = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/501", id],
    queryFn: () => {
      return ipc.invoke("qt/501", id);
    },
  });
};

export const useSetupApp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (p: SetupAppInput) => {
      return ipc.invoke("qt/setup-app", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
