import { queryClient } from "@/lib/query";
import { fetchActivation } from "@/api/fetchActivation";
import { useIndexedStore } from "@/hooks/useIndexedStore";

export const loader = async () => {
  const activateCode = useIndexedStore.getState().activateCode;
  // Do not to Verify when activation code is not exist
  if (!activateCode) return { isOk: false };
  const data = await queryClient.ensureQueryData(fetchActivation(activateCode));
  return data;
};
