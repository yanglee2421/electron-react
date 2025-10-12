import { fetchOpenAtLogin, fetchVersion } from "#renderer/api/fetch_preload";
import { QueryProvider } from "#renderer/components/query";

export const loader = async () => {
  const queryClient = QueryProvider.queryClient;
  const version = await queryClient.ensureQueryData(fetchVersion());
  const openAtLogin = await queryClient.ensureQueryData(fetchOpenAtLogin());

  return { version, openAtLogin };
};
