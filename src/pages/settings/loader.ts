import { fetchLoginItemSettings, fetchVersion } from "./fetchers";
import { queryClient } from "@/lib/constants";

export const loader = async () => {
  const loginItemSettings = await queryClient.ensureQueryData(
    fetchLoginItemSettings()
  );
  const version = await queryClient.ensureQueryData(fetchVersion());
  return { version, loginItemSettings };
};
