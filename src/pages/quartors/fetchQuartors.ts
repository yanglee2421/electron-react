import { queryOptions } from "@tanstack/react-query";
import { queryQuartors } from "@electron/channel";
import { IpcRendererEvent } from "electron";
import { type NodeOdbcError } from "odbc";

export type Quartor = {
  "szIDs": string;
  "szIDsWheel": string | null;
  "szWHModel": string | null;
  "szUsername": string | null;
  "szIDsMake": string | null;
  "szIDsFirst": string | null;
  "szIDsLast": string | null;
  "szTMMake": string | null;
  "szTMFirst": string | null;
  "szTMLast": string | null;
  "ftRadiu": number;
  "bFlaws": string | null;
  "bWheelLS": string | null;
  "bWheelRS": string | null;
  "bSickLD": string | null;
  "bSickRD": string | null;
  "tmnow": string | null;
  "szResult": string | null;
  "szMemo": string | null;
  "DB": string | null;
  "bJiXiaoReportOut": string | null;
  "bHeGe": string | null;
  "startTime": string | null;
  "endTime": string | null;
};

type Res = {
  data: {
    rows: Quartor[];
  };
  error: Error | NodeOdbcError | null;
};

export const fetchQuartors = () =>
  queryOptions({
    queryKey: [queryQuartors],
    async queryFn() {
      const data = await new Promise<Res>((resolve) => {
        const fn = (e: IpcRendererEvent, data: Res) => {
          void e;
          if (data.error) {
            throw data.error;
          }
          resolve(data);
          window.ipcRenderer.off(queryQuartors, fn);
        };
        window.ipcRenderer.on(queryQuartors, fn);
        window.ipcRenderer.send(queryQuartors);
      });

      return data;
    },
  });
