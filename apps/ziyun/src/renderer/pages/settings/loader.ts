import { fetchOpenAtLogin } from "#renderer/api/fetch_preload";
import { QueryProvider } from "#renderer/components/query";

export const loader = async () => {
  const queryClient = QueryProvider.queryClient;
  const openAtLogin = await queryClient.ensureQueryData(fetchOpenAtLogin());

  return { openAtLogin };
};
