import type { CHR502Input, CHR53AInput } from "#main/features/printer/types";
import { ipc } from "#renderer/lib/ipc";
import { queryOptions } from "@tanstack/react-query";

const QUERY_KEY = "printer";

export const fetchCHR501Data = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, id],
    queryFn: () => {
      return ipc.invoke("printer/chr501", id);
    },
  });
};

export const fetchCHR502Data = (params: CHR502Input) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "chr502", params],
    queryFn: () => {
      return ipc.invoke("printer/chr502", params);
    },
  });
};

export const fetchCHR503Data = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "chr503", id],
    queryFn: () => {
      return ipc.invoke("printer/chr503", id);
    },
  });
};

export const fetchCHR53AData = (input: CHR53AInput) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "chr53a", input],
    queryFn: () => {
      return ipc.invoke("printer/chr53a", input);
    },
  });
};

export const fetchCHR52AData = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "chr52a", id],
    queryFn: () => {
      return ipc.invoke("printer/chr52a", id);
    },
  });
};

export const fetchQuartorCHR501Data = (id: string) => {
  return queryOptions({
    queryKey: [QUERY_KEY, "quartor-chr501", id],
    queryFn: () => {
      return ipc.invoke("printer/quartor-chr501", id);
    },
  });
};
