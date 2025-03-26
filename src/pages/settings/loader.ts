import { queryClient } from "@/lib/query";

export const loader = async () => {
  const data = await queryClient.ensureQueryData({
    queryKey: [],
    queryFn: () => ({}),
  });

  return data;
};
