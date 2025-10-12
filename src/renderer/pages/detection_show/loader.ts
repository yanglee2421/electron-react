import { fetchDataFromRootDB } from "#renderer/api/fetch_preload";
import { QueryProvider } from "#renderer/components/query";
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async (ctx) => {
  await QueryProvider.queryClient.ensureQueryData(
    fetchDataFromRootDB({
      tableName: "detections_data",
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
