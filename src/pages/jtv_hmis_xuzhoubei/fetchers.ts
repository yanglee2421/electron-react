import { useMutation } from "@tanstack/react-query";
import { useIndexedStore } from "@/hooks/useIndexedStore";
import dayjs from "dayjs";
import type { GetRequest, SaveDataParams } from "#/electron/jtv_hmis_xuzhoubei";

export const useGetData = () => {
  const set = useIndexedStore((s) => s.set);

  return useMutation({
    mutationFn: async (params: GetRequest) => {
      const data = await window.electronAPI.jtv_hmis_xuzhoubei_get_data(params);
      return data;
    },
    onSuccess(data) {
      set((d) => {
        // Remove history that is not today
        d.jtv_hmis_xuzhoubei.history = d.jtv_hmis_xuzhoubei.history.filter(
          (i) => dayjs(i.date).isAfter(dayjs().startOf("day"))
        );

        // Update or add history
        const matchedRow = d.jtv_hmis_xuzhoubei.history.find(
          (row) => row.barCode === data[0].DH
        );
        if (matchedRow) {
          matchedRow.isUploaded = false;
        } else {
          d.jtv_hmis_xuzhoubei.history.unshift({
            id: crypto.randomUUID(),
            barCode: data[0].DH,
            zh: data[0].ZH,
            date: new Date().toISOString(),
            isUploaded: false,
            PJ_ZZRQ: data[0].CZZZRQ,
            PJ_ZZDW: data[0].CZZZDW,
            PJ_SCZZRQ: data[0].SCZZRQ, // 首次组装日期
            PJ_SCZZDW: data[0].SCZZDW, // 首次组装单位
            PJ_MCZZRQ: data[0].MCZZRQ, // 末次组装日期
            PJ_MCZZDW: data[0].MCZZDW, // 末次组装单位
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
      const data = await window.electronAPI.jtv_hmis_xuzhoubei_save_data(
        params
      );
      return data;
    },
    onSuccess(data) {
      const records = new Set(data.dhs);

      set((d) => {
        d.jtv_hmis_xuzhoubei.history.forEach((row) => {
          if (records.has(row.barCode)) {
            row.isUploaded = true;
          }
        });
      });
    },
  });
};
