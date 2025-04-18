import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const fetchHxzyHmisSetting = () =>
  queryOptions({
    queryKey: ["window.electronAPI.hxzy_hmis_setting_get"],
    queryFn: async () => {
      return window.electronAPI.hxzy_hmis_setting_get();
    },
  });

export const useUpdateHxzyHmisSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      ...rest: Parameters<typeof window.electronAPI.hxzy_hmis_setting_set>
    ) => {
      return window.electronAPI.hxzy_hmis_setting_set(...rest);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchHxzyHmisSetting().queryKey,
      });
    },
  });
};
