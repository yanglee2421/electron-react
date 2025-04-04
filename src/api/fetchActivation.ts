import { queryOptions } from "@tanstack/react-query";

export const fetchActivation = (code: string) =>
  queryOptions({
    queryKey: ["fetchActivateCode", code],
    queryFn: async () => {
      const data = await window.electronAPI.verifyActivation(code);
      return data;
    },
  });
