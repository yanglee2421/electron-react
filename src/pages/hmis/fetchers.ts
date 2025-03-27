import { useMutation } from "@tanstack/react-query";
import { ipcRenderer } from "@/lib/utils";
import * as channel from "@electron/channel";
import type { GetRequest, GetResponse } from "@/api/api_types";
import type { AutoInputToVCParams } from "@/api/autoInput_types";
import { useIndexedStore } from "@/hooks/useIndexedStore";

export const useAutoInputToVC = () => {
  return useMutation({
    mutationFn: async (params: AutoInputToVCParams) => {
      const data = await ipcRenderer.invoke(channel.autoInputToVC, params);
      return data as GetResponse;
    },
  });
};

export const useFetchInfoFromAPI = () => {
  return useMutation({
    mutationFn: async (params: GetRequest) => {
      const data = await ipcRenderer.invoke(channel.fetchInfoFromAPI, params);
      return data as GetResponse;
    },
  });
};

export const useUploadByZh = () => {
  const settings = useIndexedStore((s) => s.settings);
  const set = useIndexedStore((s) => s.set);

  return useMutation({
    mutationFn: async (zh: string) => {
      const data = await ipcRenderer.invoke(channel.uploadByZh, {
        driverPath: settings.driverPath,
        databasePath: settings.databasePath,
        zh,
      });
      return data;
    },
    onSuccess(data, variables) {
      void data;
      set((d) => {
        d.getRecords.forEach((row) => {
          if (row.zh === variables) {
            row.isUploaded = true;
          }
        });
      });
    },
  });
};
