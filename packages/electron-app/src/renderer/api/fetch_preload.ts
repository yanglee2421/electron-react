import type { AutoInputToVCParams } from "#main/features/cmd/types";
import type { MDBPayload } from "#main/features/mdb/types";
import type { PLCWritePayload } from "#main/features/plc/types";
import type { IPCContract } from "#main/ipc/types";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

export interface MDBUser {
  szUid: string;
  szPasswd: string | null;
  bAdmin: boolean;
  lastLogin: string;
  szMemo: string | null;
  userCode: string | null;
}

type Args<TKey extends keyof IPCContract> = IPCContract[TKey] extends {
  args: infer TArgs;
}
  ? TArgs extends unknown[]
    ? TArgs
    : []
  : never;

type Return<TKey extends keyof IPCContract> = IPCContract[TKey] extends {
  return: infer TReturn;
}
  ? Promise<TReturn>
  : never;

const invoke = <TKey extends keyof IPCContract>(
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

export const useMobileMode = () => {
  return useMutation({
    mutationFn: async (mobile: boolean) => {
      return await invoke("APP/MOBILE_MODE", mobile);
    },
  });
};

type Result<TRow> = {
  total: number;
  rows: TRow[];
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

export const fetchIsRunAsAdmin = () => {
  return queryOptions({
    queryKey: ["WIN/isRunAsAdmin"],
    queryFn: async () => {
      const data = await invoke("WIN/isRunAsAdmin");
      return data;
    },
  });
};
