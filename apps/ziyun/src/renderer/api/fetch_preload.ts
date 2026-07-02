import type { AutoInputToVCParams } from "#main/features/cmd/types";
import { ipc } from "#renderer/lib/ipc";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

// 自动录入功能
export const useAutoInputToVC = () => {
  return useMutation({
    mutationFn: async (params: AutoInputToVCParams) => {
      return await ipc.invoke("WIN/autoInputToVC", params);
    },
  });
};

// Electron 相关函数
export const fetchOpenAtLogin = () =>
  queryOptions({
    queryKey: ["APP/OPEN_AT_LOGIN"],
    queryFn: async () => {
      return await ipc.invoke("APP/OPEN_AT_LOGIN");
    },
  });

export const useOpenAtLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (openAtLogin: boolean) => {
      return await ipc.invoke("APP/OPEN_AT_LOGIN", openAtLogin);
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
      return await ipc.invoke("APP/OPEN_PATH", path);
    },
  });
};

export const useOpenDevTools = () => {
  return useMutation({
    mutationFn: async () => {
      await ipc.invoke("APP/OPEN_DEV_TOOLS");
      return true;
    },
  });
};

export const useMobileMode = () => {
  return useMutation({
    mutationFn: async (mobile: boolean) => {
      return await ipc.invoke("APP/MOBILE_MODE", mobile);
    },
  });
};

export const useSelectDirectory = () => {
  return useMutation({
    mutationFn: async () => {
      return ipc.invoke("APP/SELECT_DIRECTORY");
    },
  });
};

export const useSelectFile = () => {
  return useMutation({
    mutationFn: async (filters: Electron.FileFilter[]) => {
      return ipc.invoke("APP/SELECT_FILE", filters);
    },
  });
};

export const useMD5BackupImage = () => {
  return useMutation({
    mutationFn: async (path: string) => {
      await ipc.invoke("MD5/MD5_BACKUP_IMAGE", path);
      return true;
    },
  });
};

export const useMD5Compute = () => {
  return useMutation({
    mutationFn: async (path: string) => {
      const result = await ipc.invoke("MD5/MD5_COMPUTE", path);
      return result;
    },
  });
};

export const useShowOpenDialog = () => {
  return useMutation({
    mutationFn: async (options: Electron.OpenDialogOptions) => {
      const filePaths = await ipc.invoke("APP/SHOW_OPEN_DIALOG", options);
      return filePaths;
    },
  });
};

export const useSelectXMLPDFFromFolder = () => {
  return useMutation({
    mutationFn: async (paths: string[]) => {
      const filePaths = await ipc.invoke(
        "XML/SELECT_XML_PDF_FROM_FOLDER",
        paths,
      );

      return filePaths;
    },
  });
};

export const fetchXMLPDFCompute = (filePaths: string[]) => {
  return queryOptions({
    queryKey: ["XML/XML_PDF_COMPUTE", filePaths],
    queryFn: async () => {
      const result = await ipc.invoke("XML/XML_PDF_COMPUTE", filePaths);
      return result;
    },
  });
};

export const fetchIsRunAsAdmin = () => {
  return queryOptions({
    queryKey: ["WIN/isRunAsAdmin"],
    queryFn: async () => {
      const data = await ipc.invoke("WIN/isRunAsAdmin");
      return data;
    },
  });
};
