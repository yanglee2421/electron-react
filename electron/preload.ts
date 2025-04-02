import { contextBridge, ipcRenderer, webUtils } from "electron";
import * as channel from "./channel";
import type { Log } from "@/hooks/useIndexedStore";
import type {
  GetDataFromAccessDatabaseParams,
  Verify,
  VerifyData,
} from "@/api/database_types";
import type { AutoInputToVCParams } from "@/api/autoInput_types";
import type * as HXZY_HMIS from "#/electron/hxzy_hmis";
import type * as JTV_HMIS from "#/electron/jtv_hmis";
import type * as JTV_HMIS_XUZHOUBEI from "#/electron/jtv_hmis_xuzhoubei";
import type * as KH_HMIS from "#/electron/kh_hmis";

type LogCallback = (data: Log) => void;
type SubscribeLog = (handler: LogCallback) => () => void;
type GetMem = () => Promise<{ totalmem: number; freemem: number }>;

const getPathForFile = (file: File) => {
  return webUtils.getPathForFile(file);
};

const openPath = async (path: string) => {
  const data = await ipcRenderer.invoke(channel.openPath, path);
  return data as string;
};

const openDevTools = () => {
  ipcRenderer.invoke(channel.openDevTools);
};

const toggleMode = async (mode: "system" | "dark" | "light") => {
  await ipcRenderer.invoke(channel.toggleMode, mode);
};

const setAlwaysOnTop = async (isAlwaysOnTop: boolean) => {
  await ipcRenderer.invoke(channel.setAlwaysOnTop, isAlwaysOnTop);
};

const getLoginItemSettings = async () => {
  const data = await ipcRenderer.invoke(channel.getLoginItemSettings);
  return data as boolean;
};

const setLoginItemSettings = async (openAtLogin: boolean) => {
  await ipcRenderer.invoke(channel.setLoginItemSettings, openAtLogin);
};

const getMem: GetMem = async () => {
  const data = await ipcRenderer.invoke(channel.mem);
  return data;
};

const getVersion = () => {
  return ipcRenderer.invoke(channel.getVersion);
};

const subscribeWindowFocus = (handler: () => void) => {
  const listener = (event: Electron.IpcRendererEvent) => {
    // Prevent unused variable warning
    void event;
    handler();
  };
  ipcRenderer.on(channel.windowFocus, listener);
  return () => {
    ipcRenderer.off(channel.windowFocus, listener);
  };
};

const subscribeWindowBlur = (handler: () => void) => {
  const listener = (event: Electron.IpcRendererEvent) => {
    // Prevent unused variable warning
    void event;
    handler();
  };
  ipcRenderer.on(channel.windowBlur, listener);
  return () => {
    ipcRenderer.off(channel.windowBlur, listener);
  };
};

const subscribeWindowShow = (handler: () => void) => {
  const listener = (event: Electron.IpcRendererEvent) => {
    // Prevent unused variable warning
    void event;
    handler();
  };
  ipcRenderer.on(channel.windowShow, listener);
  return () => {
    ipcRenderer.off(channel.windowShow, listener);
  };
};

const subscribeWindowHide = (handler: () => void) => {
  const listener = (event: Electron.IpcRendererEvent) => {
    // Prevent unused variable warning
    void event;
    handler();
  };
  ipcRenderer.on(channel.windowHide, listener);
  return () => {
    ipcRenderer.off(channel.windowHide, listener);
  };
};

const subscribeLog: SubscribeLog = (handler) => {
  const listener = (event: Electron.IpcRendererEvent, data: Log) => {
    // Prevent unused variable warning
    void event;
    handler(data);
  };

  ipcRenderer.on(channel.log, listener);

  return () => {
    ipcRenderer.off(channel.log, listener);
  };
};

const getDataFromAccessDatabase = async <TRecord = unknown>(
  params: GetDataFromAccessDatabaseParams
) => {
  const data = await ipcRenderer.invoke(
    channel.getDataFromAccessDatabase,
    params
  );
  return data as TRecord[];
};

const autoInputToVC = async (params: AutoInputToVCParams) => {
  const data: string = await ipcRenderer.invoke(channel.autoInputToVC, params);
  return data;
};

const hxzy_hmis_get_data = async (params: HXZY_HMIS.GetRequest) => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_get_data, params);
  return data as HXZY_HMIS.GetResponse;
};

const hxzy_hmis_save_data = async (params: HXZY_HMIS.SaveDataParams) => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_save_data, params);
  return data as { result: HXZY_HMIS.PostResponse; dhs: string[] };
};

const hxzy_hmis_upload_verifies = async (
  params: HXZY_HMIS.UploadVerifiesParams
) => {
  const data = await ipcRenderer.invoke(
    channel.hxzy_hmis_upload_verifies,
    params
  );
  return data as {
    verifies: Verify;
    verifiesData: VerifyData[];
  };
};

const jtv_hmis_get_data = async (params: JTV_HMIS.GetRequest) => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_get_data, params);
  return data as JTV_HMIS.GetResponse;
};

const jtv_hmis_save_data = async (params: JTV_HMIS.SaveDataParams) => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_save_data, params);
  return data as { result: JTV_HMIS.PostResponse; dhs: string[] };
};

const jtv_hmis_xuzhoubei_get_data = async (
  params: JTV_HMIS_XUZHOUBEI.GetRequest
) => {
  const data = await ipcRenderer.invoke(
    channel.jtv_hmis_xuzhoubei_get_data,
    params
  );
  return data as JTV_HMIS_XUZHOUBEI.GetResponse;
};

const jtv_hmis_xuzhoubei_save_data = async (
  params: JTV_HMIS_XUZHOUBEI.SaveDataParams
) => {
  await ipcRenderer.invoke(channel.jtv_hmis_xuzhoubei_save_data, params);
};

const kh_hmis_get_data = async (params: KH_HMIS.GetRequest) => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_get_data, params);
  return data as KH_HMIS.GetResponse;
};

const kh_hmis_save_data = async (params: KH_HMIS.SaveDataParams) => {
  await ipcRenderer.invoke(channel.kh_hmis_save_data, params);
};

const electronAPI = {
  // Electron
  openPath,
  openDevTools,
  toggleMode,
  setAlwaysOnTop,
  getPathForFile,
  getMem,
  setLoginItemSettings,
  getLoginItemSettings,
  getVersion,

  // CMD
  getDataFromAccessDatabase,
  autoInputToVC,

  // HTTP
  hxzy_hmis_get_data,
  hxzy_hmis_save_data,
  hxzy_hmis_upload_verifies,
  jtv_hmis_get_data,
  jtv_hmis_save_data,
  jtv_hmis_xuzhoubei_get_data,
  jtv_hmis_xuzhoubei_save_data,
  kh_hmis_get_data,
  kh_hmis_save_data,

  // Subscriptions
  subscribeLog,
  subscribeWindowFocus,
  subscribeWindowBlur,
  subscribeWindowShow,
  subscribeWindowHide,
};

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }

  // interface ImportMeta {
  //   myname: string;
  // }

  // interface ImportMetaEnv {
  //   myname: string;
  // }
}
