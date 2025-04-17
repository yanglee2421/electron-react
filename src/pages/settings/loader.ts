import { fetchVersion, fetchSettins } from "./fetchers";
import { QueryProvider } from "@/components/query";

export const loader = async () => {
  const queryClient = QueryProvider.queryClient;
  const version = await queryClient.ensureQueryData(fetchVersion());
  const settings = await queryClient.ensureQueryData(fetchSettins());

  return { version, settings };
};
