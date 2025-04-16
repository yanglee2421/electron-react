import { fetchLoginItemSettings, fetchVersion, fetchSettins } from "./fetchers";
import { QueryProvider } from "@/components/query";

export const loader = async () => {
  const queryClient = QueryProvider.queryClient;
  const loginItemSettings = await queryClient.ensureQueryData(
    fetchLoginItemSettings(),
  );
  const version = await queryClient.ensureQueryData(fetchVersion());
  const settings = await queryClient.ensureQueryData(fetchSettins());
  return { version, loginItemSettings, settings };
};
