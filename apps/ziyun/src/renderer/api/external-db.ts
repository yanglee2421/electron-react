import { ipc } from "#renderer/lib/ipc";
import { queryOptions } from "@tanstack/react-query";

const QUERY_KEY = "external-db";

export const fetchExternalDBAnniversary = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "external-db/anniversary"],
    queryFn: async () => {
      return ipc.invoke("external-db/anniversary");
    },
  });
};

export const fetchExternalDBAnniversaryDetail = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "external-db/anniversary-detail", id],
    queryFn: async () => {
      return ipc.invoke("external-db/anniversary-detail", id);
    },
  });
};

export const fetchExternalDB503 = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "external-db/503", id],
    queryFn: () => {
      return ipc.invoke("external-db/503", id);
    },
  });
};

export const fetchExternalDB501 = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "external-db/501", id],
    queryFn: () => {
      return ipc.invoke("external-db/501", id);
    },
  });
};
