import { useMutation } from "@tanstack/react-query";
import type { AutoInputToVCParams } from "@/api/autoInput_types";

export const useAutoInputToVC = () => {
  return useMutation({
    mutationFn: async (params: AutoInputToVCParams) => {
      const data = await window.electronAPI.autoInputToVC(params);
      return data;
    },
  });
};
