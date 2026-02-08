import {
  queryOptions,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import type {
  AutoInputToVCParams,
  InsertRecordParams,
  IpcContract,
  PLCWritePayload,
  SQLiteGetParams,
  SqliteXlsxSizeCParams,
  SqliteXlsxSizeRParams,
  SqliteXlsxSizeUParams,
} from "#main/lib/ipc";
import type {
  HXZY_HMIS,
  KH_HMIS,
  JTV_HMIS,
  JTV_HMIS_Guangzhoubei,
  JTV_HMIS_XUZHOUBEI,
} from "#main/lib/store";
import type { MDBPayload } from "#main/modules/mdb";
import type { Profile } from "#main/lib/profile";

export type MDBUser = {
  szUid: string;
  szPasswd: string | null;
  bAdmin: boolean;
  lastLogin: string;
  szMemo: string | null;
  userCode: string | null;
};

type Args<TKey extends keyof IpcContract> = IpcContract[TKey] extends {
  args: infer TArgs;
}
  ? TArgs extends unknown[]
    ? TArgs
    : []
  : never;

type Return<TKey extends keyof IpcContract> = IpcContract[TKey] extends {
  return: infer TReturn;
}
  ? Promise<TReturn>
  : never;

type JTVZHGetPayload = {
  barcode: string;
  isZhMode?: boolean;
};

const invoke = <TKey extends keyof IpcContract>(
  channel: TKey,
  ...args: Args<TKey>
): Return<TKey> => {
  const result = window.electron.ipcRenderer.invoke(channel, ...args);
  return result as unknown as Return<TKey>;
};

// 自动录入功能
export const useAutoInputToVC = () => {
  return useMutation({
    mutationFn: async (params: AutoInputToVCParams) => {
      return await invoke("WIN/autoInputToVC", params);
    },
  });
};

// 华兴致远HMIS (成都北)
export const fetchHxzyHmisSqliteGet = (params: SQLiteGetParams) =>
  queryOptions({
    queryKey: ["window.electronAPI.hxzy_hmis_sqlite_get", params],
    queryFn: async () => {
      return await invoke("HMIS/hxzy_hmis_sqlite_get", params);
    },
  });

export const useHxzyHmisSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await invoke("HMIS/hxzy_hmis_sqlite_delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchHxzyHmisSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useHxzyHmisApiGet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (barcode: string) => {
      return await invoke("HMIS/hxzy_hmis_api_get", barcode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchHxzyHmisSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useHxzyHmisApiSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await invoke("HMIS/hxzy_hmis_api_set", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchHxzyHmisSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useHxzyHmisApiVerifies = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      return await invoke("HMIS/hxzy_hmis_api_verifies", id);
    },
  });
};

export const fetchHxzyHmisSetting = () =>
  queryOptions({
    queryKey: ["window.electronAPI.hxzy_hmis_setting"],
    queryFn: async () => {
      return await invoke("HMIS/hxzy_hmis_setting");
    },
  });

export const useUpdateHxzyHmisSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: Partial<HXZY_HMIS>) => {
      return await invoke("HMIS/hxzy_hmis_setting", setting);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchHxzyHmisSetting().queryKey,
      });
    },
  });
};

// 京天威HMIS (徐州北)
export const fetchJtvHmisXuzhoubeiSqliteGet = (params: SQLiteGetParams) =>
  queryOptions({
    queryKey: ["window.electronAPI.jtv_hmis_xuzhoubei_sqlite_get", params],
    queryFn: async () => {
      return await invoke("HMIS/jtv_hmis_xuzhoubei_sqlite_get", params);
    },
  });

export const useJtvHmisXuzhoubeiSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await invoke("HMIS/jtv_hmis_xuzhoubei_sqlite_delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisXuzhoubeiSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useJtvHmisXuzhoubeiApiGet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (barcode: string) => {
      return await invoke("HMIS/jtv_hmis_xuzhoubei_api_get", barcode);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisXuzhoubeiSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const useJtvHmisXuzhoubeiApiSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await invoke("HMIS/jtv_hmis_xuzhoubei_api_set", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisXuzhoubeiSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const fetchJtvHmisXuzhoubeiSetting = () =>
  queryOptions({
    queryKey: ["window.electronAPI.jtv_hmis_xuzhoubei_setting"],
    queryFn: async () => {
      return await invoke("HMIS/jtv_hmis_xuzhoubei_setting");
    },
  });

export const useUpdateJtvHmisXuzhoubeiSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: Partial<JTV_HMIS_XUZHOUBEI>) => {
      return await invoke("HMIS/jtv_hmis_xuzhoubei_setting", setting);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisXuzhoubeiSetting().queryKey,
      });
    },
  });
};

// 康华HMIS (安康)
export const useKhHmisApiGet = () => {
  return useMutation({
    mutationFn: async (barcode: string) => {
      return await invoke("HMIS/kh_hmis_api_get", barcode);
    },
  });
};

export const useKhHmisApiSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await invoke("HMIS/kh_hmis_api_set", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchKhHmisSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

export const fetchKhHmisSetting = () =>
  queryOptions({
    queryKey: ["HMIS/kh_hmis_setting"],
    queryFn: async () => {
      return await invoke("HMIS/kh_hmis_setting");
    },
  });

export const useUpdateKhHmisSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: Partial<KH_HMIS>) => {
      return await invoke("HMIS/kh_hmis_setting", setting);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchKhHmisSetting().queryKey,
      });
    },
  });
};

export const fetchKhHmisSqliteGet = (params: SQLiteGetParams) =>
  queryOptions({
    queryKey: ["HMIS/kh_hmis_sqlite_get", params],
    queryFn: async () => {
      return await invoke("HMIS/kh_hmis_sqlite_get", params);
    },
  });

export const useKhHmisSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await invoke("HMIS/kh_hmis_sqlite_delete", id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchKhHmisSqliteGet({
          pageIndex: 1,
          pageSize: 10,
          startDate: "",
          endDate: "",
        }).queryKey.slice(0, 1),
      });
    },
  });
};

// Electron 相关函数
export const fetchOpenAtLogin = () =>
  queryOptions({
    queryKey: ["APP/OPEN_AT_LOGIN"],
    queryFn: async () => {
      return await invoke("APP/OPEN_AT_LOGIN");
    },
  });

export const useOpenAtLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (openAtLogin: boolean) => {
      return await invoke("APP/OPEN_AT_LOGIN", openAtLogin);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchOpenAtLogin().queryKey,
      });
    },
  });
};

export const useOpenPath = () => {
  return useMutation({
    mutationFn: async (path: string) => {
      return await invoke("APP/OPEN_PATH", path);
    },
  });
};

export const useOpenDevTools = () => {
  return useMutation({
    mutationFn: async () => {
      await invoke("APP/OPEN_DEV_TOOLS");
      return true;
    },
  });
};

export const fetchVersion = () =>
  queryOptions({
    queryKey: ["VERSION/GET"],
    queryFn: async () => {
      const data = await invoke("VERSION/GET");
      return data;
    },
  });

export const useMobileMode = () => {
  return useMutation({
    mutationFn: async (mobile: boolean) => {
      return await invoke("APP/MOBILE_MODE", mobile);
    },
  });
};

export const fetchSqliteXlsxSize = (params?: SqliteXlsxSizeRParams) =>
  queryOptions({
    queryKey: ["XLSX/sqlite_xlsx_size_r", params],
    queryFn() {
      return invoke("XLSX/sqlite_xlsx_size_r", params);
    },
  });

export const useXlsxSizeCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn(params: SqliteXlsxSizeCParams) {
      return invoke("XLSX/sqlite_xlsx_size_c", params);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: fetchSqliteXlsxSize().queryKey.slice(0, 1),
      });
    },
  });
};

export const useXlsxSizeUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn(params: SqliteXlsxSizeUParams) {
      return invoke("XLSX/sqlite_xlsx_size_u", params);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: fetchSqliteXlsxSize().queryKey.slice(0, 1),
      });
    },
  });
};

export const useXlsxSizeDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn(id: number) {
      return invoke("XLSX/sqlite_xlsx_size_d", id);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: fetchSqliteXlsxSize().queryKey.slice(0, 1),
      });
    },
  });
};

export const useChr53aExport = () => {
  return useMutation({
    mutationFn: async (params: string[]) => {
      const data = await invoke("XLSX/xlsx_chr_53a", params);
      return data;
    },
  });
};

type Result<TRow> = {
  total: number;
  rows: TRow[];
};

export const useChr501Export = () => {
  return useMutation({
    async mutationFn(id: string) {
      const result = await invoke("XLSX/XLSX_CHR501", id);
      return result;
    },
  });
};

export const fetchProfile = () =>
  queryOptions({
    queryKey: ["PROFILE/GET"],
    queryFn: async () => {
      const profile: Profile = await invoke("PROFILE/GET");

      return profile;
    },
  });

export const useProfileUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Profile>) => {
      const updated = await invoke("PROFILE/SET", payload);
      return updated;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchProfile().queryKey,
      });
    },
  });
};

export const useSelectDirectory = () => {
  return useMutation({
    mutationFn: async () => {
      const filePaths = await invoke("APP/SELECT_DIRECTORY");
      return filePaths;
    },
  });
};

export const useSelectFile = () => {
  return useMutation({
    mutationFn: async (filters: Electron.FileFilter[]) => {
      const filePaths = await invoke("APP/SELECT_FILE", filters);
      return filePaths;
    },
  });
};

export const fetchDataFromRootDB = <TRow>(data: MDBPayload) =>
  queryOptions({
    queryKey: ["MDB/MDB_ROOT_GET", data],
    queryFn: async () => {
      const result = await invoke("MDB/MDB_ROOT_GET", data);

      return result as Result<TRow>;
    },
  });

export const fetchDataFromAppDB = <TRow>(data: MDBPayload) =>
  queryOptions({
    queryKey: ["MDB/MDB_APP_GET", data],
    queryFn: async () => {
      const result = await invoke("MDB/MDB_APP_GET", data);

      return result as Result<TRow>;
    },
  });

export const useMD5BackupImage = () => {
  return useMutation({
    mutationFn: async (path: string) => {
      await invoke("MD5/MD5_BACKUP_IMAGE", path);
      return true;
    },
  });
};

export const useMD5Compute = () => {
  return useMutation({
    mutationFn: async (path: string) => {
      const result = await invoke("MD5/MD5_COMPUTE", path);
      return result;
    },
  });
};

export const useXML = () => {
  return useMutation({
    mutationFn: async (xml: string) => {
      const result = await invoke("XML/XML", xml);
      return result;
    },
  });
};

export const useShowOpenDialog = () => {
  return useMutation({
    mutationFn: async (options: Electron.OpenDialogOptions) => {
      const filePaths = await invoke("APP/SHOW_OPEN_DIALOG", options);
      return filePaths;
    },
  });
};

export const useSelectXMLPDFFromFolder = () => {
  return useMutation({
    mutationFn: async (paths: string[]) => {
      const filePaths = await invoke("XML/SELECT_XML_PDF_FROM_FOLDER", paths);

      return filePaths;
    },
  });
};

export const fetchXMLPDFCompute = (filePaths: string[]) => {
  return queryOptions({
    queryKey: ["XML/XML_PDF_COMPUTE", filePaths],
    queryFn: async () => {
      const result = await invoke("XML/XML_PDF_COMPUTE", filePaths);
      return result;
    },
  });
};

export const fetchPLCReadTest = (path: string) => {
  return queryOptions({
    queryKey: ["PLC/read_test", path],
    queryFn: async () => {
      const data = await invoke("PLC/read_test", path);
      return data;
    },
  });
};

export const usePLCWriteTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PLCWritePayload) => {
      const data = await invoke("PLC/write_test", payload);

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [fetchPLCReadTest("").queryKey.slice(0, 1)],
      });
    },
  });
};

export const fetchSerialPortList = () => {
  return queryOptions({
    queryKey: ["PLC/serialport_list"],
    queryFn: async () => {
      const data = await invoke("PLC/serialport_list");

      return data;
    },
  });
};

export const fetchJtvHmisGuangzhoubeiSetting = () =>
  queryOptions({
    queryKey: ["HMIS/jtv_hmis_guangzhoubei_setting"],
    queryFn: async () => {
      return invoke("HMIS/jtv_hmis_guangzhoubei_setting");
    },
  });

export const useUpdateJtvHmisGuangzhoubeiSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<JTV_HMIS_Guangzhoubei>) => {
      return invoke("HMIS/jtv_hmis_guangzhoubei_setting", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisGuangzhoubeiSetting().queryKey,
      });
    },
  });
};

export const fetchJtvHmisGuangzhoubeiSqliteGet = (payload: SQLiteGetParams) =>
  queryOptions({
    queryKey: ["HMIS/jtv_hmis_guangzhoubei_sqlite_get", payload],
    queryFn: () => {
      return invoke("HMIS/jtv_hmis_guangzhoubei_sqlite_get", payload);
    },
  });

export const useJtvHmisGuangzhoubeiSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return invoke("HMIS/jtv_hmis_guangzhoubei_sqlite_delete", id);
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
    mutationFn: async (payload: InsertRecordParams) => {
      return invoke("HMIS/jtv_hmis_guangzhoubei_sqlite_insert", payload);
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

export const useJtvHmisGuangzhoubeiApiGet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ barcode, isZhMode }: JTVZHGetPayload) => {
      return invoke("HMIS/jtv_hmis_guangzhoubei_api_get", barcode, isZhMode);
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
      return invoke("HMIS/jtv_hmis_guangzhoubei_api_set", id);
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

export const fetchJtvHmisSqliteGet = (payload: SQLiteGetParams) =>
  queryOptions({
    queryKey: ["HMIS/jtv_hmis_sqlite_get", payload],
    queryFn: () => {
      return invoke("HMIS/jtv_hmis_sqlite_get", payload);
    },
  });

export const useJtvHmisSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      return invoke("HMIS/jtv_hmis_sqlite_delete", id);
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
    mutationFn: (payload: InsertRecordParams) => {
      return invoke("HMIS/jtv_hmis_sqlite_insert", payload);
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
    mutationFn: ({ barcode, isZhMode }: JTVZHGetPayload) => {
      return invoke("HMIS/jtv_hmis_api_get", barcode, isZhMode);
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
      return invoke("HMIS/jtv_hmis_api_set", id);
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
    queryKey: ["HMIS/jtv_hmis_setting"],
    queryFn: () => {
      return invoke("HMIS/jtv_hmis_setting");
    },
  });

export const useUpdateJtvHmisSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<JTV_HMIS>) => {
      return invoke("HMIS/jtv_hmis_setting", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisSetting().queryKey,
      });
    },
  });
};
