import { useMutation } from "@tanstack/react-query";

export const useUploadVerifies = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await window.electronAPI.hxzy_hmis_api_verifies(id);
      return data;
    },
  });
};
