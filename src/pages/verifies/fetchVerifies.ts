import { queryOptions } from "@tanstack/react-query";
import * as channel from "@electron/channel";
import { IpcRendererEvent } from "electron";
import { type NodeOdbcError } from "odbc";

export type Verify = {
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
  "tmNow": string | null;
  "szResult": string | null;
  "szMemo": string | null;
  "startTime": string | null;
  "endTime": string | null;
};

type Res = {
  data: {
    rows: Verify[];
  };
  error: Error | NodeOdbcError | null;
};

export const fetchVerifies = (params: channel.DbParamsBase) =>
  queryOptions({
    queryKey: [params.path, params.password, channel.queryVerifies],
    async queryFn() {
      const data = await new Promise<Res>((resolve) => {
        const fn = (e: IpcRendererEvent, data: Res) => {
          void e;
          if (data.error) {
            throw data.error;
          }
          resolve(data);
          window.ipcRenderer.off(channel.queryVerifies, fn);
        };
        window.ipcRenderer.on(channel.queryVerifies, fn);
        window.ipcRenderer.send(channel.queryVerifies, params);
      });

      return data;
    },
  });
