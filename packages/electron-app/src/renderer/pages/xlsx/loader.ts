import type { LoaderFunction } from "react-router";
import { QueryProvider } from "#renderer/components/query";
import { fetchSqliteXlsxSize } from "#renderer/api/fetch_preload";

export const loader: LoaderFunction = async () => {
  await QueryProvider.queryClient.ensureQueryData(
    fetchSqliteXlsxSize({
      pageIndex: 0,
      pageSize: 100,
      xlsxName: "",
      type: "",
    }),
  );
};
