import {
  queryOptions,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import type {
  HxzyHmisSettingParams,
  HxzyBarcodeGetParams,
  JtvHmisSettingParams,
  JtvBarcodeGetParams,
  JtvHmisXuzhoubeiSettingParams,
  JtvXuzhoubeiBarcodeGetParams,
  KhHmisSettingParams,
  KhBarcodeGetParams,
  SetSettingParams,
  SqliteXlsxSizeRParams,
  SqliteXlsxSizeCParams,
  SqliteXlsxSizeUParams,
} from "~/index";
import type { AutoInputToVCParams } from "#/cmd";
import type * as PRELOAD from "~/index";
import { channel } from "#/channel";

// Windows 激活验证
export const fetchVerifyActivation = () =>
  queryOptions({
    queryKey: ["window.electronAPI.verifyActivation"],
    queryFn: async () => {
      return await window.electronAPI.verifyActivation();
    },
  });

// C# Driver相关
export const fetchDataFromAccessDatabase = <TRecord = unknown>(sql: string) =>
  queryOptions({
    queryKey: ["window.electronAPI.getDataFromAccessDatabase", sql],
    queryFn: async () => {
      return await window.electronAPI.getDataFromAccessDatabase<TRecord>(sql);
    },
  });

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

export const fetchMem = () =>
  queryOptions({
    queryKey: ["window.electronAPI.getMem"],
    queryFn: async () => {
      return await window.electronAPI.getMem();
    },
  });

export const fetchVersion = () =>
  queryOptions({
    queryKey: ["window.electronAPI.getVersion"],
    queryFn: async () => {
      return await window.electronAPI.getVersion();
    },
  });

export const useMobileMode = () => {
  return useMutation({
    mutationFn: async (mobile: boolean) => {
      return await window.electronAPI.mobileMode(mobile);
    },
  });
};

export const fetchSettings = () =>
  queryOptions({
    queryKey: ["window.electronAPI.settings"],
    queryFn: async () => {
      return await window.electronAPI.settings();
    },
  });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setting: SetSettingParams) => {
      return await window.electronAPI.settings(setting);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: fetchSettings().queryKey,
      });
    },
  });
};

export const useSettingsOpenInEditor = () => {
  return useMutation({
    mutationFn: async () => {
      await window.electronAPI.settingsOpenInEditor();
      return true;
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
