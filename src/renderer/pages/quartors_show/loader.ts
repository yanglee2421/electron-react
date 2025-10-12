import type { QuartorData } from "#/modules/cmd";
import { fetchDataFromRootDB } from "@/api/fetch_preload";
import { QueryProvider } from "@/components/query";
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async (ctx) => {
  await QueryProvider.queryClient.ensureQueryData(
    fetchDataFromRootDB<QuartorData>({
      tableName: "quartors_data",
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
