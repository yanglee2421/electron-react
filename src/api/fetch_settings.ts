import {
  queryOptions,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";

export const fetchSettins = () =>
  queryOptions({
    queryKey: ["window.electronAPI.settings"],
    queryFn: async () => {
      return await window.electronAPI.settings();
    },
  });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      ...rest: Parameters<typeof window.electronAPI.settings>
    ) => {
      return await window.electronAPI.settings(...rest);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchSettins().queryKey,
      });
    },
  });
};
