import {
  queryOptions,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { channel } from "#main/channel";
import type {
  HxzyHmisSettingParams,
  HxzyBarcodeGetParams,
  JtvHmisSettingParams,
  JtvBarcodeGetParams,
  JtvHmisXuzhoubeiSettingParams,
  JtvXuzhoubeiBarcodeGetParams,
  KhHmisSettingParams,
  KhBarcodeGetParams,
  SqliteXlsxSizeRParams,
  SqliteXlsxSizeCParams,
  SqliteXlsxSizeUParams,
} from "#preload/index";
import type * as PRELOAD from "#preload/index";
import type { AutoInputToVCParams } from "#main/modules/cmd";
import type { Profile } from "#main/lib/profile";
import type { Payload } from "#main/modules/mdb";
import type { Invoice } from "#main/modules/xml";

// 自动录入功能
export const useAutoInputToVC = () => {
  return useMutation({
    mutationFn: async (params: AutoInputToVCParams) => {
      return await window.electronAPI.autoInputToVC(params);
    },
  });
};

// 华兴致远HMIS (成都北)
export const fetchHxzyHmisSqliteGet = (params: HxzyBarcodeGetParams) =>
  queryOptions({
    queryKey: ["window.electronAPI.hxzy_hmis_sqlite_get", params],
    queryFn: async () => {
      return await window.electronAPI.hxzy_hmis_sqlite_get(params);
    },
  });

export const useHxzyHmisSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await window.electronAPI.hxzy_hmis_sqlite_delete(id);
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
      return await window.electronAPI.hxzy_hmis_api_get(barcode);
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
      return await window.electronAPI.hxzy_hmis_api_set(id);
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
      return await window.electronAPI.hxzy_hmis_api_verifies(id);
    },
  });
};

export const fetchHxzyHmisSetting = () =>
  queryOptions({
    queryKey: ["window.electronAPI.hxzy_hmis_setting"],
    queryFn: async () => {
      return await window.electronAPI.hxzy_hmis_setting();
    },
  });

export const useUpdateHxzyHmisSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: HxzyHmisSettingParams) => {
      return await window.electronAPI.hxzy_hmis_setting(setting);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchHxzyHmisSetting().queryKey,
      });
    },
  });
};

// 京天威HMIS (统型)
export const fetchJtvHmisSqliteGet = (params: JtvBarcodeGetParams) =>
  queryOptions({
    queryKey: ["window.electronAPI.jtv_hmis_sqlite_get", params],
    queryFn: async () => {
      return await window.electronAPI.jtv_hmis_sqlite_get(params);
    },
  });

export const useJtvHmisSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await window.electronAPI.jtv_hmis_sqlite_delete(id);
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
    mutationFn: async (barcode: string) => {
      return await window.electronAPI.jtv_hmis_api_get(barcode);
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
    mutationFn: async (id: number) => {
      return await window.electronAPI.jtv_hmis_api_set(id);
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
    queryFn: async () => {
      return await window.electronAPI.jtv_hmis_setting();
    },
  });

export const useUpdateJtvHmisSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: JtvHmisSettingParams) => {
      return await window.electronAPI.jtv_hmis_setting(setting);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisSetting().queryKey,
      });
    },
  });
};

// 京天威HMIS (徐州北)
export const fetchJtvHmisXuzhoubeiSqliteGet = (
  params: JtvXuzhoubeiBarcodeGetParams,
) =>
  queryOptions({
    queryKey: ["window.electronAPI.jtv_hmis_xuzhoubei_sqlite_get", params],
    queryFn: async () => {
      return await window.electronAPI.jtv_hmis_xuzhoubei_sqlite_get(params);
    },
  });

export const useJtvHmisXuzhoubeiSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await window.electronAPI.jtv_hmis_xuzhoubei_sqlite_delete(id);
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
      return await window.electronAPI.jtv_hmis_xuzhoubei_api_get(barcode);
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
      return await window.electronAPI.jtv_hmis_xuzhoubei_api_set(id);
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
      return await window.electronAPI.jtv_hmis_xuzhoubei_setting();
    },
  });

export const useUpdateJtvHmisXuzhoubeiSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: JtvHmisXuzhoubeiSettingParams) => {
      return await window.electronAPI.jtv_hmis_xuzhoubei_setting(setting);
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
      return await window.electronAPI.kh_hmis_api_get(barcode);
    },
  });
};

export const useKhHmisApiSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await window.electronAPI.kh_hmis_api_set(id);
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
    queryKey: ["window.electronAPI.kh_hmis_setting"],
    queryFn: async () => {
      return await window.electronAPI.kh_hmis_setting();
    },
  });

export const useUpdateKhHmisSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: KhHmisSettingParams) => {
      return await window.electronAPI.kh_hmis_setting(setting);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchKhHmisSetting().queryKey,
      });
    },
  });
};

export const fetchKhHmisSqliteGet = (params: KhBarcodeGetParams) =>
  queryOptions({
    queryKey: ["window.electronAPI.kh_hmis_sqlite_get", params],
    queryFn: async () => {
      return await window.electronAPI.kh_hmis_sqlite_get(params);
    },
  });

export const useKhHmisSqliteDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await window.electronAPI.kh_hmis_sqlite_delete(id);
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
    queryKey: ["window.electronAPI.openAtLogin"],
    queryFn: async () => {
      return await window.electronAPI.openAtLogin();
    },
  });

export const useOpenAtLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (openAtLogin: boolean) => {
      return await window.electronAPI.openAtLogin(openAtLogin);
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
      return await window.electronAPI.openPath(path);
    },
  });
};

export const useOpenDevTools = () => {
  return useMutation({
    mutationFn: async () => {
      await window.electronAPI.openDevTools();
      return true;
    },
  });
};

type GetVersionResponse = {
  version: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  v8Version: string;
};

export const fetchVersion = () =>
  queryOptions({
    queryKey: [channel.VERSION],
    queryFn: async () => {
      const data: GetVersionResponse = await window.electron.ipcRenderer.invoke(
        channel.VERSION,
      );
      return data;
    },
  });

export const useMobileMode = () => {
  return useMutation({
    mutationFn: async (mobile: boolean) => {
      return await window.electronAPI.mobileMode(mobile);
    },
  });
};

export const fetchSqliteXlsxSize = (params?: SqliteXlsxSizeRParams) =>
  queryOptions({
    queryKey: ["window.electronAPI.sqliteXlsxSizeR", params],
    queryFn() {
      return window.electronAPI.sqliteXlsxSizeR(params);
    },
  });

export const useXlsxSizeCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn(params: SqliteXlsxSizeCParams) {
      return window.electronAPI.sqliteXlsxSizeC(params);
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
      return window.electronAPI.sqliteXlsxSizeU(params);
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
    mutationFn(params: PRELOAD.SqliteXlsxSizeDParams) {
      return window.electronAPI.sqliteXlsxSizeD(params);
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
      const data = await window.electron.ipcRenderer.invoke(
        channel.xlsx_chr_53a,
        params,
      );
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
      const result = await window.electron.ipcRenderer.invoke(
        channel.XLSX_CHR501,
        id,
      );
      return result;
    },
  });
};

export const fetchProfile = () =>
  queryOptions({
    queryKey: [channel.PROFILE_GET],
    queryFn: async () => {
      const profile: Profile = await window.electron.ipcRenderer.invoke(
        channel.PROFILE_GET,
      );

      return profile;
    },
  });

export const useProfileUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Profile>) => {
      const updated: Profile = await window.electron.ipcRenderer.invoke(
        channel.PROFILE_SET,
        payload,
      );
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
      const filePaths: string[] = await window.electron.ipcRenderer.invoke(
        channel.SELECT_DIRECTORY,
      );
      return filePaths;
    },
  });
};

export const useSelectFile = () => {
  return useMutation({
    mutationFn: async (filters: Electron.FileFilter[]) => {
      const filePaths: string[] = await window.electron.ipcRenderer.invoke(
        channel.SELECT_FILE,
        filters,
      );
      return filePaths;
    },
  });
};

export const fetchDataFromRootDB = <TRow>(data: Payload) =>
  queryOptions({
    queryKey: [channel.MDB_ROOT_GET, data],
    queryFn: async () => {
      const result: Result<TRow> = await window.electron.ipcRenderer.invoke(
        channel.MDB_ROOT_GET,
        data,
      );

      return result;
    },
  });

export const fetchDataFromAppDB = <TRow>(data: Payload) =>
  queryOptions({
    queryKey: [channel.MDB_APP_GET, data],
    queryFn: async () => {
      const result: Result<TRow> = await window.electron.ipcRenderer.invoke(
        channel.MDB_APP_GET,
        data,
      );

      return result;
    },
  });

export type MDBUser = {
  szUid: string;
  szPasswd: string | null;
  bAdmin: boolean;
  lastLogin: string;
  szMemo: string | null;
  userCode: string | null;
};

export const useMD5BackupImage = () => {
  return useMutation({
    mutationFn: async (path: string) => {
      await window.electron.ipcRenderer.invoke(channel.MD5_BACKUP_IMAGE, path);
      return true;
    },
  });
};

export const useMD5Compute = () => {
  return useMutation({
    mutationFn: async (path: string) => {
      const result: Record<string, string> =
        await window.electron.ipcRenderer.invoke(channel.MD5_COMPUTE, path);
      return result;
    },
  });
};

export const useXML = () => {
  return useMutation({
    mutationFn: async (xml: string) => {
      const result = await window.electron.ipcRenderer.invoke(channel.XML, xml);
      return result;
    },
  });
};

export const useLab = () => {
  return useMutation({
    mutationFn: async (path: string) => {
      const result: string = await window.electron.ipcRenderer.invoke(
        channel.LAB,
        path,
      );
      return result;
    },
  });
};

export const useShowOpenDialog = () => {
  return useMutation({
    mutationFn: async (options: Electron.OpenDialogOptions) => {
      const filePaths: string[] = await window.electron.ipcRenderer.invoke(
        channel.SHOW_OPEN_DIALOG,
        options,
      );
      return filePaths;
    },
  });
};

export const useSelectXMLPDFFromFolder = () => {
  return useMutation({
    mutationFn: async (paths: string[]) => {
      const filePaths: string[] = await window.electron.ipcRenderer.invoke(
        channel.SELECT_XML_PDF_FROM_FOLDER,
        paths,
      );
      return filePaths;
    },
  });
};

export const fetchXMLPDFCompute = (filePaths: string[]) => {
  return queryOptions({
    queryKey: [channel.XML_PDF_COMPUTE, filePaths],
    queryFn: async () => {
      const result: Invoice[] = await window.electron.ipcRenderer.invoke(
        channel.XML_PDF_COMPUTE,
        filePaths,
      );
      return result;
    },
  });
};

type JTV_HMIS_Guangzhoubei = {
  autoInput: boolean;
  autoUpload: boolean;
  autoUploadInterval: number;
  unitCode: string;
  get_host: string;
  post_host: string;
};

export const fetchJtvHmisGuangzhoubeiSetting = () =>
  queryOptions({
    queryKey: ["window.electronAPI.jtv_hmis_guangzhoubei_setting"],
    queryFn: async () => {
      const data: JTV_HMIS_Guangzhoubei =
        await window.electron.ipcRenderer.invoke(
          channel.jtv_hmis_guangzhoubei_setting,
        );

      return data;
    },
  });

export const useUpdateJtvHmisGuangzhoubeiSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: JTV_HMIS_Guangzhoubei) => {
      const data: JTV_HMIS_Guangzhoubei =
        await window.electron.ipcRenderer.invoke(
          channel.jtv_hmis_guangzhoubei_setting,
          setting,
        );

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchJtvHmisGuangzhoubeiSetting().queryKey,
      });
    },
  });
};
