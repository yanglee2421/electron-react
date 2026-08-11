import type {
  AnniversaryInput,
  Fetch502DateInput,
  SetupAppInput,
  SetYiqiConfigLibInput,
} from "#main/features/qt/types";
import { ipc } from "#renderer/lib/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const QUERY_KEY = "qt";

export const fetchExternalDBAnniversary = (input: AnniversaryInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/anniversary", input],
    queryFn: async () => {
      return ipc.invoke("qt/anniversary", input);
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

export const fetchExternalDB502 = (p: Fetch502DateInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/502", p],
    queryFn: () => {
      return ipc.invoke("qt/502", p);
    },
  });
};

export const useSetupApp = () => {
  return useMutation({
    mutationFn: (p: SetupAppInput) => {
      return ipc.invoke("qt/setup-app", p);
    },
  });
};

export const fetchCurrentLocalDB = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/current-db-path"],
    queryFn: () => {
      return ipc.invoke("qt/current-db-path");
    },
  });
};

export const fetchYiqiConfig = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/yiqiConfig/list"],
    queryFn: async () => {
      return ipc.invoke("qt/yiqiConfig/list");
    },
  });
};

export const useSetYiqiLib = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (p: SetYiqiConfigLibInput) => {
      return ipc.invoke("qt/yiqiConfig/lib", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useSetYiqiFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (p: number) => {
      return ipc.invoke("qt/yiqiConfig/flag", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useStartApp = () => {
  return useMutation({
    mutationFn: async () => {
      return ipc.invoke("qt/start-app");
    },
  });
};

export const fetchQtQuartors = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/quartors"],
    queryFn: async () => {
      return ipc.invoke("qt/quartors");
    },
  });
};