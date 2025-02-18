import { queryOptions } from "@tanstack/react-query";
import * as channel from "@electron/channel";
import { ipcRenderer } from "@/lib/utils";

export type Quartor = {
  szIDs: string;
  szIDsWheel: string | null;
  szWHModel: string | null;
  szUsername: string | null;
  szIDsMake: string | null;
  szIDsFirst: string | null;
  szIDsLast: string | null;
  szTMMake: string | null;
  szTMFirst: string | null;
  szTMLast: string | null;
  ftRadiu: number;
  bFlaws: string | null;
  bWheelLS: string | null;
  bWheelRS: string | null;
  bSickLD: string | null;
  bSickRD: string | null;
  tmnow: string | null;
  szResult: string | null;
  szMemo: string | null;
  DB: string | null;
  bJiXiaoReportOut: string | null;
  bHeGe: string | null;
  startTime: string | null;
  endTime: string | null;
};

type Res = {
  data: {
    rows: Quartor[];
  };
};

export const fetchQuartors = (params: channel.DbParamsBase) =>
  queryOptions({
    queryKey: [params.path, params.password, channel.queryQuartors],
    async queryFn() {
      const data: Res = await ipcRenderer.invoke(channel.queryQuartors, params);

      return data;
    },
    networkMode: "offlineFirst",
  });
