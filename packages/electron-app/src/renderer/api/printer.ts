import { ipc } from "#renderer/lib/ipc";
import { queryOptions } from "@tanstack/react-query";

const QUERY_KEY = "printer";

export const fetchCHR501Data = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      return ipc.invoke("printer/chr501", id);
    },
  });
};
