import {
  queryOptions,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";

export const fetchSettins = () =>
  queryOptions({
    queryKey: ["window.electronAPI.getSetting"],
    queryFn: async () => {
      return await window.electronAPI.getSetting();
    },
  });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      ...rest: Parameters<typeof window.electronAPI.setSetting>
    ) => {
      return await window.electronAPI.setSetting(...rest);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchSettins().queryKey,
      });
    },
  });
};
