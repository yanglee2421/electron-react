import { fetchDataFromAccessDatabase } from "@/api/fetch_preload";
import { QueryProvider } from "@/components/query";
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async (ctx) => {
  const sql = `SELECT * FROM detections_data WHERE opid ='${ctx.params.id}'`;

  await QueryProvider.queryClient.ensureQueryData(
    fetchDataFromAccessDatabase(sql),
  );
};
