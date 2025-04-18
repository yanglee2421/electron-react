import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export const fetchHxzyHmisBarcode = (
  ...rest: Parameters<typeof window.electronAPI.hxzy_hmis_barcode_get>
) =>
  queryOptions({
    queryKey: ["window.electronAPI.hxzy_hmis_setting_get", rest],
    queryFn: async () => {
      return window.electronAPI.hxzy_hmis_barcode_get(...rest);
    },
  });

export const useGetData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (barcode: string) => {
      const data = await window.electronAPI.hxzy_hmis_get_data(barcode);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchHxzyHmisBarcode({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useSaveData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const data = await window.electronAPI.hxzy_hmis_save_data(id);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchHxzyHmisBarcode({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};
