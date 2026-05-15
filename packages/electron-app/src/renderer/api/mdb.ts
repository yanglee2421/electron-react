import type {
  ListAnniversaryInput,
  ListQuartorInput,
  ListUserInput,
  ListVerifiesInput,
} from "#main/features/mdb/types";
import { ipc } from "#renderer/lib/ipc";
import { queryOptions } from "@tanstack/react-query";

const QUERY_KEY = "mdb";

export const fetchQuartor = (params: ListQuartorInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "quartor", params],
    queryFn: () => {
      return ipc.invoke("mdb/quartor", params);
    },
  });
};

export const fetchUser = (params: ListUserInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "user", params],
    queryFn: () => {
      return ipc.invoke("mdb/user", params);
    },
  });
};

export const fetchVerifies = (params: ListVerifiesInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "verifies", params],
    queryFn: () => {
      return ipc.invoke("mdb/verifies", params);
    },
  });
};

export const fetchAnniversary = (params: ListAnniversaryInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "anniversary", params],
    queryFn: () => {
      return ipc.invoke("mdb/anniversary", params);
    },
  });
};

export const fetchAnniversaryById = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "anniversary/id", id],
    queryFn: () => {
      return ipc.invoke("mdb/anniversary/id", id);
    },
  });
};
