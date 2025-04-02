import { useMutation } from "@tanstack/react-query";
import { useIndexedStore } from "@/hooks/useIndexedStore";
import dayjs from "dayjs";
import type { GetRequest, SaveDataParams } from "#/electron/kh_hmis";

export const useGetData = () => {
  const set = useIndexedStore((s) => s.set);

  return useMutation({
    mutationFn: async (params: GetRequest) => {
      const data = await window.electronAPI.kh_hmis_get_data(params);
      return data;
    },
    onSuccess(data) {
      set((d) => {
        // Remove history that is not today
        d.kh_hmis.history = d.kh_hmis.history.filter((i) =>
          dayjs(i.date).isAfter(dayjs().startOf("day"))
        );

        // Update or add history
        const matchedRow = d.kh_hmis.history.find(
          (row) => row.barCode === data.data.mesureId
        );
        if (matchedRow) {
          matchedRow.isUploaded = false;
        } else {
          d.kh_hmis.history.unshift({
            id: crypto.randomUUID(),
            barCode: data.data.mesureId,
            zh: data.data.zh,
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
      const data = await window.electronAPI.kh_hmis_save_data(params);
      return data;
    },
    onSuccess(data, variable) {
      void data;

      set((d) => {
        d.kh_hmis.history.forEach((row) => {
          if (row.barCode === variable.dh) {
            row.isUploaded = true;
          }
        });
      });
    },
  });
};
