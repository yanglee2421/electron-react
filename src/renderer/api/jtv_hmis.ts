// 京天威HMIS (统型)

import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { channel } from "#main/channel";
import type {
  HandleDeleteRecord,
  HandleFetchRecord,
  HandleHMISSetting,
  HandleInsertRecord,
  HandleReadRecords,
  HandleSendData,
} from "#main/modules/hmis/jtv_hmis";

const invoke = window.electron.ipcRenderer.invoke.bind(
  window.electron.ipcRenderer,
);

const handleDeleteRecord: HandleDeleteRecord = (...args) =>
  invoke(channel.jtv_hmis_sqlite_delete, ...args);
const handleFetchRecord: HandleFetchRecord = (...args) =>
  invoke(channel.jtv_hmis_api_get, ...args);
const handleHMISSetting: HandleHMISSetting = (...args) =>
  invoke(channel.jtv_hmis_setting, ...args);
const handleInsertRecord: HandleInsertRecord = (...args) =>
  invoke(channel.jtv_hmis_sqlite_insert, ...args);
const handleReadRecords: HandleReadRecords = (...args) =>
  invoke(channel.jtv_hmis_sqlite_get, ...args);
const handleSendData: HandleSendData = (...args) =>
  invoke(channel.jtv_hmis_api_set, ...args);

export const fetchJtvHmisSqliteGet = (...args: Parameters<HandleReadRecords>) =>
  queryOptions({
    queryKey: ["window.electronAPI.jtv_hmis_sqlite_get", ...args],
    queryFn: () => {
      return handleReadRecords(...args);
    },
  });

export const useJtvHmisSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return handleDeleteRecord(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useJtvHmisSqliteInsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<HandleInsertRecord>[0]) => {
      return handleInsertRecord(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useJtvHmisApiGet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      barcode,
      isZhMode,
    }: {
      barcode: string;
      isZhMode?: boolean;
    }) => {
      return handleFetchRecord(barcode, isZhMode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useJtvHmisApiSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return handleSendData(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const fetchJtvHmisSetting = () =>
  queryOptions({
    queryKey: ["window.electronAPI.jtv_hmis_setting"],
    queryFn: () => {
      return handleHMISSetting();
    },
  });

export const useUpdateJtvHmisSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<HandleHMISSetting>[0]) => {
      return handleHMISSetting(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisSetting().queryKey,
      });
    },
  });
};
