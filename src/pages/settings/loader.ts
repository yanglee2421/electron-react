import { fetchLoginItemSettings } from "./fetchers";
import { queryClient } from "@/lib/query";

export const loader = async () => {
  const data = await queryClient.ensureQueryData(fetchLoginItemSettings());
  return data;
};
