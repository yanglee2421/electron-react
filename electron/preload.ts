import { contextBridge, ipcRenderer, webUtils } from "electron";
import * as channel from "./channel";
import type { Verify, VerifyData } from "./cmd";
import type * as SCHEMA from "./schema";
import type * as STORE from "./store";
import type { Log } from "#/src/lib/db";

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
  return data as TRecord[];
};

// HTTP 相关的各个 HMIS 系统函数
// 华兴致远HMIS (成都北)
const hxzy_hmis_api_get = async (barcode: string): Promise<string> => {
  await ipcRenderer.invoke(channel.hxzy_hmis_api_get, barcode);
  return barcode;
};

const hxzy_hmis_api_set = async (id: number): Promise<number> => {
  await ipcRenderer.invoke(channel.hxzy_hmis_api_set, id);
  return id;
};

const hxzy_hmis_api_verifies = async (
  id: string,
): Promise<{
  verifies: Verify;
  verifiesData: VerifyData[];
}> => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_api_verifies, id);
  return data as {
    verifies: Verify;
    verifiesData: VerifyData[];
  };
};

const hxzy_hmis_setting_get = async (): Promise<STORE.HXZY_HMIS> => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_setting_get);
  return data as STORE.HXZY_HMIS;
};

export type HxzyHmisSettingSetParams = Partial<STORE.HXZY_HMIS>;

const hxzy_hmis_setting_set = async (
  setting: HxzyHmisSettingSetParams,
): Promise<STORE.HXZY_HMIS> => {
  const data = await ipcRenderer.invoke(channel.hxzy_hmis_setting_set, setting);
  return data as STORE.HXZY_HMIS;
};

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
  return data as HxzyBarcodeGetResult;
};

const hxzy_hmis_sqlite_delete = async (id: number): Promise<number> => {
  await ipcRenderer.invoke(channel.hxzy_hmis_sqlite_delete, id);
  return id;
};

// 京天威HMIS (统型)
const jtv_hmis_api_get = async (barcode: string): Promise<string> => {
  await ipcRenderer.invoke(channel.jtv_hmis_api_get, barcode);
  return barcode;
};

const jtv_hmis_api_set = async (id: number): Promise<number> => {
  await ipcRenderer.invoke(channel.jtv_hmis_api_set, id);
  return id;
};

const jtv_hmis_setting_get = async (): Promise<STORE.JTV_HMIS> => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_setting_get);
  return data as STORE.JTV_HMIS;
};

export type JtvHmisSettingSetParams = Partial<STORE.JTV_HMIS>;

const jtv_hmis_setting_set = async (
  setting: JtvHmisSettingSetParams,
): Promise<STORE.JTV_HMIS> => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_setting_set, setting);
  return data as STORE.JTV_HMIS;
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

const jtv_hmis_sqlite_get = async (
  params: GetJtvBarcodeParams,
): Promise<GetJtvBarcodeResult> => {
  const data = await ipcRenderer.invoke(channel.jtv_hmis_sqlite_get, params);
  return data;
};

const jtv_hmis_sqlite_delete = async (id: number): Promise<number> => {
  await ipcRenderer.invoke(channel.jtv_hmis_sqlite_delete, id);
  return id;
};

// 京天威HMIS (徐州北)
const jtv_hmis_xuzhoubei_api_get = async (barcode: string): Promise<string> => {
  await ipcRenderer.invoke(channel.jtv_hmis_xuzhoubei_api_get, barcode);
  return barcode;
};

const jtv_hmis_xuzhoubei_api_set = async (id: number): Promise<number> => {
  await ipcRenderer.invoke(channel.jtv_hmis_xuzhoubei_api_set, id);
  return id;
};

const jtv_hmis_xuzhoubei_setting_get =
  async (): Promise<STORE.JTV_HMIS_XUZHOUBEI> => {
    const data = await ipcRenderer.invoke(
      channel.jtv_hmis_xuzhoubei_setting_get,
    );
    return data as STORE.JTV_HMIS_XUZHOUBEI;
  };

export type JtvHmisXuzhoubeiSettingSetParams =
  Partial<STORE.JTV_HMIS_XUZHOUBEI>;

const jtv_hmis_xuzhoubei_setting_set = async (
  setting: JtvHmisXuzhoubeiSettingSetParams,
): Promise<STORE.JTV_HMIS_XUZHOUBEI> => {
  const data = await ipcRenderer.invoke(
    channel.jtv_hmis_xuzhoubei_setting_set,
    setting,
  );
  return data as STORE.JTV_HMIS_XUZHOUBEI;
};

export type GetJtvXuzhoubeiBarcodeParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

export type GetJtvXuzhoubeiBarcodeResult = {
  count: number;
  rows: SCHEMA.JtvXuzhoubeiBarcode[];
};

const jtv_hmis_xuzhoubei_sqlite_get = async (
  params: GetJtvXuzhoubeiBarcodeParams,
): Promise<GetJtvXuzhoubeiBarcodeResult> => {
  const data = await ipcRenderer.invoke(
    channel.jtv_hmis_xuzhoubei_sqlite_get,
    params,
  );
  return data;
};

const jtv_hmis_xuzhoubei_sqlite_delete = async (
  id: number,
): Promise<number> => {
  await ipcRenderer.invoke(channel.jtv_hmis_xuzhoubei_sqlite_delete, id);
  return id;
};

// 康华HMIS (安康)
const kh_hmis_api_get = async (barcode: string): Promise<string> => {
  await ipcRenderer.invoke(channel.kh_hmis_api_get, barcode);
  return barcode;
};

const kh_hmis_api_set = async (id: number): Promise<number> => {
  await ipcRenderer.invoke(channel.kh_hmis_api_set, id);
  return id;
};

const kh_hmis_setting_get = async (): Promise<STORE.KH_HMIS> => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_setting_get);
  return data as STORE.KH_HMIS;
};

export type KhHmisSettingSetParams = Partial<STORE.KH_HMIS>;

const kh_hmis_setting_set = async (
  setting: KhHmisSettingSetParams,
): Promise<STORE.KH_HMIS> => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_setting_set, setting);
  return data as STORE.KH_HMIS;
};

export type GetKhBarcodeParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

export type GetKhBarcodeResult = {
  count: number;
  rows: SCHEMA.KhBarcode[];
};

const kh_hmis_sqlite_get = async (
  params: GetKhBarcodeParams,
): Promise<GetKhBarcodeResult> => {
  const data = await ipcRenderer.invoke(channel.kh_hmis_sqlite_get, params);
  return data;
};

const kh_hmis_sqlite_delete = async (id: number): Promise<number> => {
  await ipcRenderer.invoke(channel.kh_hmis_sqlite_delete, id);
  return id;
};

// Electron 相关函数
const getPathForFile = (file: File): string => {
  return webUtils.getPathForFile(file);
};

const openPath = async (path: string): Promise<string> => {
  const data = await ipcRenderer.invoke(channel.openPath, path);
  return data as string;
};

const openDevTools = async (): Promise<boolean> => {
  await ipcRenderer.invoke(channel.openDevTools);
  return true;
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
    return () => ipcRenderer.off(channel, listener);
  };
};

const subscribeWindowFocus = createSubscribe(channel.windowFocus);
const subscribeWindowBlur = createSubscribe(channel.windowBlur);
const subscribeWindowShow = createSubscribe(channel.windowShow);
const subscribeWindowHide = createSubscribe(channel.windowHide);

const getVersion = async (): Promise<string> => {
  const data: string = await ipcRenderer.invoke(channel.getVersion);
  return data;
};

// SQLite 相关函数
const getSetting = async (): Promise<STORE.Settings> => {
  const data: STORE.Settings = await ipcRenderer.invoke(channel.getSetting);
  return data;
};

export type SetSettingParams = Partial<STORE.Settings>;

const setSetting = async (param: SetSettingParams): Promise<STORE.Settings> => {
  const data: STORE.Settings = await ipcRenderer.invoke(
    channel.setSetting,
    param,
  );
  return data;
};

const electronAPI = {
  // Windows 10
  verifyActivation,

  // C# Driver
  getDataFromAccessDatabase,

  // 华兴致远HMIS (成都北)
  hxzy_hmis_api_get,
  hxzy_hmis_api_set,
  hxzy_hmis_api_verifies,
  hxzy_hmis_setting_get,
  hxzy_hmis_setting_set,
  hxzy_hmis_sqlite_get,
  hxzy_hmis_sqlite_delete,

  // 京天威HMIS (统型)
  jtv_hmis_api_get,
  jtv_hmis_api_set,
  jtv_hmis_setting_get,
  jtv_hmis_setting_set,
  jtv_hmis_sqlite_get,
  jtv_hmis_sqlite_delete,

  // 京天威HMIS (徐州北)
  jtv_hmis_xuzhoubei_api_get,
  jtv_hmis_xuzhoubei_api_set,
  jtv_hmis_xuzhoubei_setting_get,
  jtv_hmis_xuzhoubei_setting_set,
  jtv_hmis_xuzhoubei_sqlite_get,
  jtv_hmis_xuzhoubei_sqlite_delete,

  // 康华HMIS (安康)
  kh_hmis_api_get,
  kh_hmis_api_set,
  kh_hmis_setting_get,
  kh_hmis_setting_set,
  kh_hmis_sqlite_get,
  kh_hmis_sqlite_delete,

  // Electron
  openPath,
  openDevTools,
  getPathForFile,
  getMem,
  getVersion,
  subscribeLog,
  subscribeWindowFocus,
  subscribeWindowBlur,
  subscribeWindowShow,
  subscribeWindowHide,

  // SQLite
  getSetting,
  setSetting,
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
