import { fetchVersion } from "@/api/fetch_preload";
import { QueryProvider } from "@/components/query";

export const loader = async () => {
  const queryClient = QueryProvider.queryClient;
  const version = await queryClient.ensureQueryData(fetchVersion());

  return { version };
};
