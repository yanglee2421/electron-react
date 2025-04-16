import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const fetchLoginItemSettings = () =>
  queryOptions({
    queryKey: ["window.electronAPI.getLoginItemSettings"],
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

export const fetchVersion = () =>
  queryOptions({
    queryKey: ["window.electronAPI.getVersion"],
    queryFn: async () => {
      return await window.electronAPI.getVersion();
    },
  });

export const fetchSettins = () =>
  queryOptions({
    queryKey: ["window.electronAPI.getSetting"],
    queryFn: async () => {
      return await window.electronAPI.getSetting();
    },
  });
