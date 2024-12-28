import { queryOptions } from "@tanstack/react-query";
import * as channel from "@electron/channel";
import { type NodeOdbcError } from "odbc";

export type Verify = {
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
  tmNow: string | null;
  szResult: string | null;
  szMemo: string | null;
  startTime: string | null;
  endTime: string | null;
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
      const data: Res = await window.ipcRenderer.invoke(
        channel.queryVerifies,
        params,
      );

      return data;
    },
  });
