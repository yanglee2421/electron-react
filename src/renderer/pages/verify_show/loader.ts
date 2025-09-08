import type { VerifyData } from "#/cmd";
import { fetchDataFromRootDB } from "@/api/fetch_preload";
import { QueryProvider } from "@/components/query";
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async (ctx) => {
  await QueryProvider.queryClient.ensureQueryData(
    fetchDataFromRootDB<VerifyData>({
      tableName: "verifies_data",
      filters: [
        {
          type: "equal",
          field: "opid",
          value: ctx.params.id || "",
        },
      ],
    }),
  );
};
