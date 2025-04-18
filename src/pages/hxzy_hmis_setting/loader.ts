import { QueryProvider } from "@/components/query";
import { fetchHxzyHmisSetting } from "./fetchers";

export const loader = async () => {
  const queryClient = QueryProvider.queryClient;
  return await queryClient.ensureQueryData(fetchHxzyHmisSetting());
};
