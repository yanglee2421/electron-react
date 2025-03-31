import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const fetchLoginItemSettings = () =>
  queryOptions({
    queryKey: ["loginItemSettings"],
    queryFn: async () => {
      return await window.electronAPI.getLoginItemSettings();
    },
  });

export const useSetLoginItemSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (openAtLogin: boolean) => {
      await window.electronAPI.setLoginItemSettings(openAtLogin);
      const value = await window.electronAPI.getLoginItemSettings();
      return value;
    },
    onSuccess(data) {
      queryClient.setQueryData(fetchLoginItemSettings().queryKey, data);
    },
  });
};
