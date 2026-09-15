import { ipc } from "#renderer/lib/ipc";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = "fuzhoudong";

export const useUploadCHR501 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return ipc.invoke("HMIS/fuzhoudong_chr501", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadCHR502 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => {
      return ipc.invoke("HMIS/fuzhoudong_chr502", ids);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};

export const useUploadCHR503 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return ipc.invoke("HMIS/fuzhoudong_chr503", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY],
      });
    },
  });
};
