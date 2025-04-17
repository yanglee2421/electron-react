import { contextBridge, ipcRenderer, webUtils } from "electron";
import * as channel from "./channel";
import type { Settings } from "./lib";
import type { Verify, VerifyData } from "#/electron/database_types";
import type { AutoInputToVCParams } from "#/electron/autoInput_types";
import type * as HXZY_HMIS from "#/electron/hxzy_hmis";
import type * as JTV_HMIS from "#/electron/jtv_hmis";
import type * as JTV_HMIS_XUZHOUBEI from "#/electron/jtv_hmis_xuzhoubei";
import type * as KH_HMIS from "#/electron/kh_hmis";
import type * as SCHEMA from "./schema";
import type { Log } from "#/src/lib/db";

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

const getMem: GetMem = async () => {
  const data = await ipcRenderer.invoke(channel.mem);
  return data;
};

const getVersion = () => {
  return ipcRenderer.invoke(channel.getVersion);
};

const createSubscribe = (channel: string) => {
  return (handler: () => void) => {
    // Create a new listener function to ensure reference equality for the off method
    const listener = () => handler();
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.off(channel, listener);
  };
};

const subscribeWindowFocus = createSubscribe(channel.windowFocus);
const subscribeWindowBlur = createSubscribe(channel.windowBlur);
const subscribeWindowShow = createSubscribe(channel.windowShow);
const subscribeWindowHide = createSubscribe(channel.windowHide);
const subscribeHxzyBarcodeEmit = createSubscribe(channel.hxzyBarcodeEmit);
const subscribeJtvBarcodeEmit = createSubscribe(channel.jtvBarcodeEmit);

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

const getDataFromAccessDatabase = async <TRecord = unknown>(sql: string) => {
  const data = await ipcRenderer.invoke(channel.getDataFromAccessDatabase, sql);
  return data as TRecord[];
};

const autoInputToVC = async (params: AutoInputToVCParams) => {
  const data: string = await ipcRenderer.invoke(channel.autoInputToVC, params);
  return data;
};

const hxzy_hmis_get_data = async (barcode: string) => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_get_data, barcode);
  return data as HXZY_HMIS.GetResponse;
};

const hxzy_hmis_save_data = async (id: number) => {
  await ipcRenderer.invoke(channel.hxzy_hmis_save_data, id);
  return id;
};

const hxzy_hmis_upload_verifies = async (id: string) => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_upload_verifies, id);
  return data as {
    verifies: Verify;
    verifiesData: VerifyData[];
  };
};

const jtv_hmis_get_data = async (barcode: string) => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_get_data, barcode);
  return data as JTV_HMIS.GetResponse;
};

const jtv_hmis_save_data = async (id: number) => {
  await ipcRenderer.invoke(channel.jtv_hmis_save_data, id);
  return id;
};

const jtv_hmis_xuzhoubei_get_data = async (barcode: string) => {
  const data = await ipcRenderer.invoke(
    channel.jtv_hmis_xuzhoubei_get_data,
    barcode,
  );
  return data as JTV_HMIS_XUZHOUBEI.GetResponse;
};

const jtv_hmis_xuzhoubei_save_data = async (id: number) => {
  await ipcRenderer.invoke(channel.jtv_hmis_xuzhoubei_save_data, id);
  return id;
};

const kh_hmis_get_data = async (barcode: string) => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_get_data, barcode);
  return data as KH_HMIS.GetResponse;
};

const kh_hmis_save_data = async (id: number) => {
  await ipcRenderer.invoke(channel.kh_hmis_save_data, id);
  return id;
};

export type VerifyActivationResult = {
  isOk: boolean;
  serial: string;
};

const verifyActivation = async () => {
  const data: VerifyActivationResult = await ipcRenderer.invoke(
    channel.verifyActivation,
  );
  return data;
};

const getSetting = async () => {
  const data: Settings = await ipcRenderer.invoke(channel.getSetting);
  return data;
};

export type SetSettingParams = Partial<Settings>;

const setSetting = async (param: SetSettingParams) => {
  const data: Settings = await ipcRenderer.invoke(channel.setSetting, param);
  return data;
};

export type GetJtvBarcodeParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

export type GetJtvBarcodeResult = {
  count: number;
  rows: SCHEMA.JTVBarcode[];
};

const jtvBarcodeGet = async (
  params: GetJtvBarcodeParams,
): Promise<GetJtvBarcodeResult> => {
  const data = await ipcRenderer.invoke(channel.jtvBarcodeGet, params);
  return data;
};

const electronAPI = {
  // Electron
  openPath,
  openDevTools,
  getPathForFile,
  getMem,
  getVersion,

  // CMD
  getDataFromAccessDatabase,
  autoInputToVC,
  verifyActivation,

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

  // SQLite
  getSetting,
  setSetting,
  jtvBarcodeGet,

  // Subscriptions
  subscribeLog,
  subscribeWindowFocus,
  subscribeWindowBlur,
  subscribeWindowShow,
  subscribeWindowHide,
  subscribeHxzyBarcodeEmit,
  subscribeJtvBarcodeEmit,
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
