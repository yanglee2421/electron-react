import type { Payload } from "#/mdb";
import { queryOptions } from "@tanstack/react-query";

type Result<TRow> = {
  total: number;
  rows: TRow[];
};

export const fetchDataFromAccessDatabase = <TRow>(data: Payload) =>
  queryOptions({
    queryKey: ["mdb:reader", data],
    queryFn: async () => {
      const result = (await window.electron.ipcRenderer.invoke(
        "mdb:reader",
        data,
      )) as Promise<Result<TRow>>;

      return result;
    },
  });
