import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const fetchHxzyHmisSetting = () =>
  queryOptions({
    queryKey: ["window.electronAPI.hxzy_hmis_setting"],
    queryFn: async () => {
      return window.electronAPI.hxzy_hmis_setting();
    },
  });

export const useUpdateHxzyHmisSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      ...rest: Parameters<typeof window.electronAPI.hxzy_hmis_setting>
    ) => {
      return window.electronAPI.hxzy_hmis_setting(...rest);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchHxzyHmisSetting().queryKey,
      });
    },
  });
};
