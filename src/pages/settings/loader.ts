import { fetchLoginItemSettings, fetchVersion } from "./fetchers";
import { QueryProvider } from "@/components/query";

export const loader = async () => {
  const queryClient = QueryProvider.queryClient;
  const loginItemSettings = await queryClient.ensureQueryData(
    fetchLoginItemSettings(),
  );
  const version = await queryClient.ensureQueryData(fetchVersion());
  return { version, loginItemSettings };
};
