import { useMutation } from "@tanstack/react-query";
import { ipcRenderer } from "@/lib/utils";
import * as channel from "@electron/channel";
import type {
  GetRequest,
  GetResponse,
  AutoInputToVCParams,
} from "./fetcher_type";

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
