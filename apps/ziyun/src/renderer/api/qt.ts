import type {
  AnniversaryInput,
  Fetch502DateInput,
  FetchDetectionsInput,
  FetchQTVerifiesInput,
  FetchQuartorsInput,
  QTCHR53AInput,
  QTMigrateDBInput,
  SetQTConfigInput,
  SetYiqiConfigLibInput,
  UpsertUserInput,
} from "#main/features/qt/types";
import { ipc } from "#renderer/lib/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const QUERY_KEY = "qt";

export const useQTReconnectDB = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      return ipc.invoke("qt/reconnect-db");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useQTMigrateDB = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (p: QTMigrateDBInput) => {
      return ipc.invoke("qt/migrate-db", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useQTExportDB = () => {
  return useMutation({
    mutationFn: () => {
      return ipc.invoke("qt/export-db");
    },
  });
};

export const fetchQTDataDirectory = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/get-data-directory"],
    queryFn: () => {
      return ipc.invoke("qt/get-data-directory");
    },
  });
};

export const fetchQTAppDBPath = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/get-app-db-path"],
    queryFn: () => {
      return ipc.invoke("qt/get-app-db-path");
    },
  });
};

export const fetchQTLocalDBPath = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/get-local-db-path"],
    queryFn: () => {
      return ipc.invoke("qt/get-local-db-path");
    },
  });
};

export const useQTSetConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (p: SetQTConfigInput) => {
      return ipc.invoke("qt/set_config", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useQTSetFlagFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (p: string) => {
      return ipc.invoke("qt/set-flagfile", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, "qt/get-data-directory"],
      });
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, "qt/get-app-db-path"],
      });
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, "qt/get-local-db-path"],
      });
    },
  });
};

export const fetchYiqiConfig = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/yiqiConfig/list"],
    queryFn: () => {
      return ipc.invoke("qt/yiqiConfig/list");
    },
  });
};

export const useSetYiqiLib = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (p: SetYiqiConfigLibInput) => {
      return ipc.invoke("qt/yiqiConfig/lib", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, "qt/yiqiConfig/list"],
      });
    },
  });
};

export const useSetYiqiFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (p: number) => {
      return ipc.invoke("qt/yiqiConfig/flag", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, "qt/yiqiConfig/list"],
      });
    },
  });
};

export const useStartApp = () => {
  return useMutation({
    mutationFn: () => {
      return ipc.invoke("qt/start-app");
    },
    retry: 1,
    retryDelay: 1000,
  });
};

export const useStopApp = () => {
  return useMutation({
    mutationFn: () => {
      return ipc.invoke("qt/stop-app");
    },
  });
};

export const fetchQTDetections = (input: FetchDetectionsInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/detections", input],
    queryFn: () => {
      return ipc.invoke("qt/detections", input);
    },
  });
};

export const fetchQTVerifies = (input: FetchQTVerifiesInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/verifies", input],
    queryFn: () => {
      return ipc.invoke("qt/verifies", input);
    },
  });
};

export const fetchQTQuartors = (input: FetchQuartorsInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/quartors", input],
    queryFn: () => {
      return ipc.invoke("qt/quartors", input);
    },
  });
};

export const fetchQTAnniversary = (input: AnniversaryInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/anniversary", input],
    queryFn: () => {
      return ipc.invoke("qt/anniversary", input);
    },
  });
};

export const fetchQTAnniversaryDetail = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/anniversary-detail", id],
    queryFn: () => {
      return ipc.invoke("qt/anniversary-detail", id);
    },
  });
};

export const fetchQTUsers = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/users"],
    queryFn: () => {
      return ipc.invoke("qt/users");
    },
  });
};

export const useDeleteQTUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return ipc.invoke("qt/delete_users", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, "qt/users"],
      });
    },
  });
};

export const useUpsertQTUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (p: UpsertUserInput) => {
      return ipc.invoke("qt/upsert_users", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, "qt/users"],
      });
    },
  });
};

export const fetchQT501 = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/501", id],
    queryFn: () => {
      return ipc.invoke("qt/501", id);
    },
  });
};

export const fetchQT502 = (p: Fetch502DateInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/502", p],
    queryFn: () => {
      return ipc.invoke("qt/502", p);
    },
  });
};

export const fetchQT503 = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/503", id],
    queryFn: () => {
      return ipc.invoke("qt/503", id);
    },
  });
};

export const fetchQT52A = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/52a", id],
    queryFn: () => {
      return ipc.invoke("qt/52a", id);
    },
  });
};

export const fetchQT53A = (input: QTCHR53AInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/53a", input],
    queryFn: () => {
      return ipc.invoke("qt/53a", input);
    },
  });
};

export const fetchQTConfig = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "qt/get_config"],
    queryFn: () => {
      return ipc.invoke("qt/get_config");
    },
  });
};

export const useSetQTConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (p: SetQTConfigInput) => {
      return ipc.invoke("qt/set_config", p);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, "qt/get_config"],
      });
    },
  });
};
