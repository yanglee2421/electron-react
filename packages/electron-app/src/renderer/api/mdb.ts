import type { ListQuartorInput } from "#main/features/mdb/types";
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
