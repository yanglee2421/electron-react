import { QueryProvider } from "@/components/query";
import { type LoaderFunction, redirect } from "react-router";
import { fetchSqliteXlsxSize } from "@/api/fetch_preload";

export const loader: LoaderFunction = async (ctx) => {
  const id = ctx.params.id;
  const queryClient = QueryProvider.queryClient;
  if (!id) {
    return redirect("/404");
  }
  await queryClient.ensureQueryData(
    fetchSqliteXlsxSize({
      id: +id,
    }),
  );
};
