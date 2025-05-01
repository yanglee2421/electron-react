import * as electronRenderer from "electron/renderer";
import * as channel from "#/channel";
import type { Verify, VerifyData, AutoInputToVCParams } from "#/cmd";
import type * as SCHEMA from "#/schema";
import type * as STORE from "#/store";
import type { Log } from "@/lib/db";
import type * as HXZY_HMIS from "#/hxzy_hmis";
import type * as JTV_HMIS from "#/jtv_hmis";
import type * as KH_HMIS from "#/kh_hmis";
import type * as JTV_HMIS_XUZHOUBEI from "#/jtv_hmis_xuzhoubei";

const { ipcRenderer, contextBridge, webUtils } = electronRenderer;

type LogCallback = (data: Log) => void;
type SubscribeLog = (handler: LogCallback) => () => void;
type GetMem = () => Promise<{ totalmem: number; freemem: number }>;

// Windows 10 相关
export type VerifyActivationResult = {
  isOk: boolean;
  serial: string;
};

const verifyActivation = async (): Promise<VerifyActivationResult> => {
  const data: VerifyActivationResult = await ipcRenderer.invoke(
    channel.verifyActivation,
  );
  return data;
};

// C# Driver 相关
const getDataFromAccessDatabase = async <TRecord = unknown>(
  sql: string,
): Promise<TRecord[]> => {
  const data = await ipcRenderer.invoke(channel.getDataFromAccessDatabase, sql);
  return data;
};

const autoInputToVC = async (params: AutoInputToVCParams): Promise<string> => {
  const data = await ipcRenderer.invoke(channel.autoInputToVC, params);
  return data;
};

// HTTP 相关的各个 HMIS 系统函数
// 华兴致远HMIS (成都北)
export type HxzyBarcodeGetParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

export type HxzyBarcodeGetResult = {
  count: number;
  rows: SCHEMA.HxzyBarcode[];
};

export const hxzy_hmis_sqlite_get = async (
  params: HxzyBarcodeGetParams,
): Promise<HxzyBarcodeGetResult> => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_sqlite_get, params);
  return data;
};

const hxzy_hmis_sqlite_delete = async (
  id: number,
): Promise<SCHEMA.HxzyBarcode> => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_sqlite_delete, id);
  return data;
};

const hxzy_hmis_api_get = async (
  barcode: string,
): Promise<HXZY_HMIS.GetResponse> => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_api_get, barcode);
  return data;
};

const hxzy_hmis_api_set = async (id: number): Promise<SCHEMA.HxzyBarcode> => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_api_set, id);
  return data;
};

const hxzy_hmis_api_verifies = async (
  id: string,
): Promise<{
  verifies: Verify;
  verifiesData: VerifyData[];
}> => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_api_verifies, id);
  return data;
};

export type HxzyHmisSettingParams = Partial<STORE.HXZY_HMIS>;

const hxzy_hmis_setting = async (
  setting?: HxzyHmisSettingParams,
): Promise<STORE.HXZY_HMIS> => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_setting, setting);
  return data;
};

// 京天威HMIS (徐州北)
export type JtvXuzhoubeiBarcodeGetParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

export type JtvXuzhoubeiBarcodeGetResult = {
  count: number;
  rows: SCHEMA.JtvXuzhoubeiBarcode[];
};

const jtv_hmis_xuzhoubei_sqlite_get = async (
  params: JtvXuzhoubeiBarcodeGetParams,
): Promise<JtvXuzhoubeiBarcodeGetResult> => {
  const data = await ipcRenderer.invoke(
    channel.jtv_hmis_xuzhoubei_sqlite_get,
    params,
  );
  return data;
};

const jtv_hmis_xuzhoubei_sqlite_delete = async (
  id: number,
): Promise<SCHEMA.JtvXuzhoubeiBarcode> => {
  const data = await ipcRenderer.invoke(
    channel.jtv_hmis_xuzhoubei_sqlite_delete,
    id,
  );
  return data;
};

const jtv_hmis_xuzhoubei_api_get = async (
  barcode: string,
): Promise<JTV_HMIS_XUZHOUBEI.GetResponse> => {
  const data = await ipcRenderer.invoke(
    channel.jtv_hmis_xuzhoubei_api_get,
    barcode,
  );
  return data;
};

const jtv_hmis_xuzhoubei_api_set = async (
  id: number,
): Promise<SCHEMA.JtvXuzhoubeiBarcode> => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_xuzhoubei_api_set, id);
  return data;
};

export type JtvHmisXuzhoubeiSettingParams = Partial<STORE.JTV_HMIS_XUZHOUBEI>;

const jtv_hmis_xuzhoubei_setting = async (
  setting?: JtvHmisXuzhoubeiSettingParams,
): Promise<STORE.JTV_HMIS_XUZHOUBEI> => {
  const data = await ipcRenderer.invoke(
    channel.jtv_hmis_xuzhoubei_setting,
    setting,
  );
  return data;
};

// 京天威HMIS (统型)
export type JtvBarcodeGetParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

export type JtvBarcodeGetResult = {
  count: number;
  rows: SCHEMA.JTVBarcode[];
};

const jtv_hmis_sqlite_get = async (
  params: JtvBarcodeGetParams,
): Promise<JtvBarcodeGetResult> => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_sqlite_get, params);
  return data;
};

const jtv_hmis_sqlite_delete = async (
  id: number,
): Promise<SCHEMA.JTVBarcode> => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_sqlite_delete, id);
  return data;
};

const jtv_hmis_api_get = async (
  barcode: string,
): Promise<JTV_HMIS.GetResponse> => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_api_get, barcode);
  return data;
};

const jtv_hmis_api_set = async (id: number): Promise<number> => {
  await ipcRenderer.invoke(channel.jtv_hmis_api_set, id);
  return id;
};

export type JtvHmisSettingParams = Partial<STORE.JTV_HMIS>;

const jtv_hmis_setting = async (
  setting?: JtvHmisSettingParams,
): Promise<STORE.JTV_HMIS> => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_setting, setting);
  return data;
};

// 康华HMIS (安康)
export type KhBarcodeGetParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

export type KhBarcodeGetResult = {
  count: number;
  rows: SCHEMA.KhBarcode[];
};

const kh_hmis_sqlite_get = async (
  params: KhBarcodeGetParams,
): Promise<KhBarcodeGetResult> => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_sqlite_get, params);
  return data;
};

const kh_hmis_sqlite_delete = async (id: number): Promise<SCHEMA.KhBarcode> => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_sqlite_delete, id);
  return data;
};

const kh_hmis_api_get = async (
  barcode: string,
): Promise<KH_HMIS.GetResponse> => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_api_get, barcode);
  return data;
};

const kh_hmis_api_set = async (id: number): Promise<SCHEMA.KhBarcode> => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_api_set, id);
  return data;
};

export type KhHmisSettingParams = Partial<STORE.KH_HMIS>;

const kh_hmis_setting = async (
  setting?: KhHmisSettingParams,
): Promise<STORE.KH_HMIS> => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_setting, setting);
  return data;
};

// Electron 相关函数
const getPathForFile = (file: File): string => {
  return webUtils.getPathForFile(file);
};

const openAtLogin = async (open?: boolean): Promise<boolean> => {
  const data = await ipcRenderer.invoke(channel.openAtLogin, open);
  return data;
};

const openDevTools = async (): Promise<boolean> => {
  await ipcRenderer.invoke(channel.openDevTools);
  return true;
};

const openPath = async (path: string): Promise<string> => {
  const data = await ipcRenderer.invoke(channel.openPath, path);
  return data;
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

const getMem: GetMem = async () => {
  const data = await ipcRenderer.invoke(channel.mem);
  return data;
};

const createSubscribe = (channel: string) => {
  return (handler: () => void) => {
    // Create a new listener function to ensure reference equality for the off method
    const listener = () => handler();
    ipcRenderer.on(channel, listener);
    return () => {
      ipcRenderer.off(channel, listener);
    };
  };
};

const subscribeWindowFocus = createSubscribe(channel.windowFocus);
const subscribeWindowBlur = createSubscribe(channel.windowBlur);
const subscribeWindowShow = createSubscribe(channel.windowShow);
const subscribeWindowHide = createSubscribe(channel.windowHide);
const subscribeHxzyHmisAPISet = createSubscribe(channel.hxzy_hmis_api_set);
const subscribeJtvHmisAPISet = createSubscribe(channel.jtv_hmis_api_set);
const subscribeKhHmisAPISet = createSubscribe(channel.kh_hmis_api_set);
const subscribeJtvHmisXuzhoubeiAPISet = createSubscribe(
  channel.jtv_hmis_xuzhoubei_api_set,
);

const getVersion = async (): Promise<string> => {
  const data = await ipcRenderer.invoke(channel.getVersion);
  return data;
};

const mobileMode = async (mobile: boolean): Promise<boolean> => {
  const data = await ipcRenderer.invoke(channel.mobileMode, mobile);
  return data;
};

export type SetSettingParams = Partial<STORE.Settings>;

const settings = async (param?: SetSettingParams): Promise<STORE.Settings> => {
  const data = await ipcRenderer.invoke(channel.settings, param);
  return data;
};

const settingsOpenInEditor = async (): Promise<void> => {
  const data = await ipcRenderer.invoke(channel.settingsOpenInEditor);
  return data;
};

const electronAPI = {
  // Windows 10
  verifyActivation,

  // C# Driver
  getDataFromAccessDatabase,
  autoInputToVC,

  // 华兴致远HMIS (成都北)
  hxzy_hmis_api_get,
  hxzy_hmis_api_set,
  hxzy_hmis_api_verifies,
  hxzy_hmis_setting,
  hxzy_hmis_sqlite_get,
  hxzy_hmis_sqlite_delete,

  // 京天威HMIS (统型)
  jtv_hmis_api_get,
  jtv_hmis_api_set,
  jtv_hmis_setting,
  jtv_hmis_sqlite_get,
  jtv_hmis_sqlite_delete,

  // 京天威HMIS (徐州北)
  jtv_hmis_xuzhoubei_api_get,
  jtv_hmis_xuzhoubei_api_set,
  jtv_hmis_xuzhoubei_setting,
  jtv_hmis_xuzhoubei_sqlite_get,
  jtv_hmis_xuzhoubei_sqlite_delete,

  // 康华HMIS (安康)
  kh_hmis_api_get,
  kh_hmis_api_set,
  kh_hmis_setting,
  kh_hmis_sqlite_get,
  kh_hmis_sqlite_delete,

  // Electron
  openAtLogin,
  openPath,
  openDevTools,
  getPathForFile,
  getMem,
  getVersion,
  mobileMode,

  // Common
  settings,
  settingsOpenInEditor,

  // Subscribe
  subscribeLog,
  subscribeWindowFocus,
  subscribeWindowBlur,
  subscribeWindowShow,
  subscribeWindowHide,
  subscribeHxzyHmisAPISet,
  subscribeJtvHmisXuzhoubeiAPISet,
  subscribeJtvHmisAPISet,
  subscribeKhHmisAPISet,
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
