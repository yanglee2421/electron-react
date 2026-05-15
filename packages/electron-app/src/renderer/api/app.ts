import { ipc } from "#renderer/lib/ipc";
import { queryOptions, useMutation } from "@tanstack/react-query";

const QUERY_KEY = "app";

export const useExportDB = () => {
  return useMutation({
    mutationFn: async () => {
      await ipc.invoke("DB/EXPORT");
      return true;
    },
  });
};

export const fetchVersion = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "version"],
    queryFn: () => {
      return ipc.invoke("app/version");
    },
  });
};
