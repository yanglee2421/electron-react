import { QueryProvider } from "@/components/query";
import { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async (ctx) => {
  const id = ctx.params.id;
  const queryClient = QueryProvider.queryClient;
  await queryClient.ensureQueryData();
};
