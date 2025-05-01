import { fetchOpenAtLogin, fetchVersion } from "@/api/fetch_preload";
import { QueryProvider } from "@/components/query";

export const loader = async () => {
  const queryClient = QueryProvider.queryClient;
  const version = await queryClient.ensureQueryData(fetchVersion());
  const openAtLogin = await queryClient.ensureQueryData(fetchOpenAtLogin());

  return { version, openAtLogin };
};
