import { ipc } from "#renderer/shared/instances/ipc";
import { useMutation } from "@tanstack/react-query";

export const useExportDB = () => {
  return useMutation({
    mutationFn: async () => {
      await ipc.invoke("DB/EXPORT");
      return true;
    },
  });
};
