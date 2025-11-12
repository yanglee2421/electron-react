import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { channel } from "#main/channel";
import { invoke } from "./invoke";
import type { ElementOf } from "#renderer/lib/utils";
import type {
  HandleDeleteRecord,
  HandleFetchRecord,
  HandleHMISSetting,
  HandleInsertRecord,
  HandleReadRecords,
  HandleSendData,
} from "#main/modules/hmis/jtv_hmis_guangzhoubei";

const handleDeleteRecord: HandleDeleteRecord = (...args) =>
  invoke(channel.jtv_hmis_guangzhoubei_sqlite_delete, ...args);
const handleFetchRecord: HandleFetchRecord = (...args) =>
  invoke(channel.jtv_hmis_guangzhoubei_api_get, ...args);
const handleHMISSetting: HandleHMISSetting = (...args) =>
  invoke(channel.jtv_hmis_guangzhoubei_setting, ...args);
const handleInsertRecord: HandleInsertRecord = (...args) =>
  invoke(channel.jtv_hmis_guangzhoubei_sqlite_insert, ...args);
const handleReadRecords: HandleReadRecords = (...args) =>
  invoke(channel.jtv_hmis_guangzhoubei_sqlite_get, ...args);
const handleSendData: HandleSendData = (...args) =>
  invoke(channel.jtv_hmis_guangzhoubei_api_set, ...args);

export type Record = ElementOf<Awaited<ReturnType<HandleFetchRecord>>>;

export const fetchJtvHmisGuangzhoubeiSetting = () =>
  queryOptions({
    queryKey: ["window.electronAPI.jtv_hmis_guangzhoubei_setting"],
    queryFn: async () => {
      return handleHMISSetting();
    },
  });

export const useUpdateJtvHmisGuangzhoubeiSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<HandleHMISSetting>[0]) => {
      return handleHMISSetting(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisGuangzhoubeiSetting().queryKey,
      });
    },
  });
};

export const fetchJtvHmisGuangzhoubeiSqliteGet = (
  ...args: Parameters<HandleReadRecords>
) =>
  queryOptions({
    queryKey: ["window.electronAPI.jtv_hmis_sqlite_get", ...args],
    queryFn: () => {
      return handleReadRecords(...args);
    },
  });

export const useJtvHmisGuangzhoubeiSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return handleDeleteRecord(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisGuangzhoubeiSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useJtvHmisGuangzhoubeiSqliteInsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Parameters<HandleInsertRecord>[0]) => {
      return handleInsertRecord(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisGuangzhoubeiSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

type GetPayload = {
  barcode: string;
  isZhMode?: boolean;
};

export const useJtvHmisGuangzhoubeiApiGet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ barcode, isZhMode }: GetPayload) => {
      return handleFetchRecord(barcode, isZhMode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisGuangzhoubeiSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useJtvHmisGuangzhoubeiApiSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return handleSendData(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisGuangzhoubeiSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};
