import { ipc } from "#renderer/lib/ipc";
import { queryOptions } from "@tanstack/react-query";

const QUERY_KEY = "external-db";

export const fetchExternalDBTest = () => {
  return queryOptions({
    queryKey: [QUERY_KEY, "external-db/test"],
    queryFn: () => {
      return ipc.invoke("external-db/test");
    },
  });
};
