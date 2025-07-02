import type { LoaderFunction } from "react-router";
import { QueryProvider } from "@/components/query";
import { fetchSqliteXlsxSize } from "@/api/fetch_preload";

export const loader: LoaderFunction = async () => {
  await QueryProvider.queryClient.ensureQueryData(
    fetchSqliteXlsxSize({
      pageIndex: 0,
      pageSize: 10,
      xlsxName: "",
      type: "",
    }),
  );
};
