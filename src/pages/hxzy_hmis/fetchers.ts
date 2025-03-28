import { useMutation } from "@tanstack/react-query";
import { ipcRenderer } from "@/lib/utils";
import * as channel from "@electron/channel";
import { useIndexedStore } from "@/hooks/useIndexedStore";
import dayjs from "dayjs";
import type {
  GetRequest,
  GetResponse,
  PostResponse,
  SaveDataParams,
} from "@electron/hxzy_hmis";
import type { AutoInputToVCParams } from "@/api/autoInput_types";

export const useAutoInputToVC = () => {
  return useMutation({
    mutationFn: async (params: AutoInputToVCParams) => {
      const data: string = await ipcRenderer.invoke(
        channel.autoInputToVC,
        params
      );
      return data;
    },
  });
};

export const useGetData = () => {
  const set = useIndexedStore((s) => s.set);

  return useMutation({
    mutationFn: async (params: GetRequest) => {
      const data = await ipcRenderer.invoke(channel.hxzy_hmis_get_data, params);
      return data as GetResponse;
    },
    onSuccess(data) {
      set((d) => {
        // Remove history that is not today
        d.hxzy_hmis.history = d.hxzy_hmis.history.filter((i) =>
          dayjs(i.date).isAfter(dayjs().startOf("day"))
        );

        // Update or add history
        const matchedRow = d.hxzy_hmis.history.find(
          (row) => row.barCode === data.data[0].DH
        );
        if (matchedRow) {
          matchedRow.isUploaded = false;
        } else {
          d.hxzy_hmis.history.unshift({
            id: crypto.randomUUID(),
            barCode: data.data[0].DH,
            zh: data.data[0].ZH,
            date: new Date().toISOString(),
            isUploaded: false,
          });
        }
      });
    },
  });
};

export const useSaveData = () => {
  const set = useIndexedStore((s) => s.set);

  return useMutation({
    mutationFn: async (params: SaveDataParams) => {
      const data = await ipcRenderer.invoke(
        channel.hxzy_hmis_save_data,
        params
      );
      return data as { result: PostResponse; dhs: string[] };
    },
    onSuccess(data) {
      const records = new Set(data.dhs);

      set((d) => {
        d.hxzy_hmis.history.forEach((row) => {
          if (records.has(row.barCode)) {
            row.isUploaded = true;
          }
        });
      });
    },
  });
};
