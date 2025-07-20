import { ipcRenderer, contextBridge, webUtils } from "electron";
import { channel } from "#/channel";
import type { Verify, VerifyData, AutoInputToVCParams } from "#/cmd";
import type * as SCHEMA from "#/schema";
import type * as STORE from "#/store";
import type { Log } from "@/lib/db";
import type * as HXZY_HMIS from "#/hxzy_hmis";
import type * as JTV_HMIS from "#/jtv_hmis";
import type * as KH_HMIS from "#/kh_hmis";
import type * as JTV_HMIS_XUZHOUBEI from "#/jtv_hmis_xuzhoubei";
import {
  electronAPI as electron,
  type ElectronAPI,
} from "@electron-toolkit/preload";

type LogCallback = (data: Log) => void;
type SubscribeLog = (handler: LogCallback) => () => void;
type GetMem = () => Promise<{ totalmem: number; freemem: number }>;

type Invoke = <TReturn = void>(
  channel: string,
  payload?: unknown,
) => Promise<TReturn>;

const invoke: Invoke = ipcRenderer.invoke;

// Windows 10 相关
export type VerifyActivationResult = {
  isOk: boolean;
  serial: string;
};

const verifyActivation = () =>
  invoke<VerifyActivationResult>(channel.verifyActivation);

// C# Driver 相关
const autoInputToVC = (params: AutoInputToVCParams) =>
  invoke<string>(channel.autoInputToVC, params);

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

export const hxzy_hmis_sqlite_get = (params: HxzyBarcodeGetParams) =>
  invoke<HxzyBarcodeGetResult>(channel.hxzy_hmis_sqlite_get, params);

const hxzy_hmis_sqlite_delete = (id: number) =>
  invoke<SCHEMA.HxzyBarcode>(channel.hxzy_hmis_sqlite_delete, id);

const hxzy_hmis_api_get = (barcode: string) =>
  invoke<HXZY_HMIS.GetResponse>(channel.hxzy_hmis_api_get, barcode);

const hxzy_hmis_api_set = (id: number) =>
  invoke<SCHEMA.HxzyBarcode>(channel.hxzy_hmis_api_set, id);

const hxzy_hmis_api_verifies = (id: string) =>
  invoke<{
    verifies: Verify;
    verifiesData: VerifyData[];
  }>(channel.hxzy_hmis_api_verifies, id);

export type HxzyHmisSettingParams = Partial<STORE.HXZY_HMIS>;

const hxzy_hmis_setting = (setting?: HxzyHmisSettingParams) =>
  invoke<STORE.HXZY_HMIS>(channel.hxzy_hmis_setting, setting);

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

const jtv_hmis_xuzhoubei_sqlite_get = (params: JtvXuzhoubeiBarcodeGetParams) =>
  invoke<JtvXuzhoubeiBarcodeGetResult>(
    channel.jtv_hmis_xuzhoubei_sqlite_get,
    params,
  );

const jtv_hmis_xuzhoubei_sqlite_delete = (id: number) =>
  invoke<SCHEMA.JtvXuzhoubeiBarcode>(
    channel.jtv_hmis_xuzhoubei_sqlite_delete,
    id,
  );

const jtv_hmis_xuzhoubei_api_get = (barcode: string) =>
  invoke<JTV_HMIS_XUZHOUBEI.GetResponse>(
    channel.jtv_hmis_xuzhoubei_api_get,
    barcode,
  );

const jtv_hmis_xuzhoubei_api_set = (id: number) =>
  invoke<SCHEMA.JtvXuzhoubeiBarcode>(channel.jtv_hmis_xuzhoubei_api_set, id);

export type JtvHmisXuzhoubeiSettingParams = Partial<STORE.JTV_HMIS_XUZHOUBEI>;

const jtv_hmis_xuzhoubei_setting = (setting?: JtvHmisXuzhoubeiSettingParams) =>
  invoke<STORE.JTV_HMIS_XUZHOUBEI>(channel.jtv_hmis_xuzhoubei_setting, setting);

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

const jtv_hmis_sqlite_get = (params: JtvBarcodeGetParams) =>
  invoke<JtvBarcodeGetResult>(channel.jtv_hmis_sqlite_get, params);

const jtv_hmis_sqlite_delete = (id: number) =>
  invoke<SCHEMA.JTVBarcode>(channel.jtv_hmis_sqlite_delete, id);

const jtv_hmis_api_get = (barcode: string) =>
  invoke<JTV_HMIS.GetResponse>(channel.jtv_hmis_api_get, barcode);

const jtv_hmis_api_set = async (id: number): Promise<number> => {
  await invoke(channel.jtv_hmis_api_set, id);
  return id;
};

export type JtvHmisSettingParams = Partial<STORE.JTV_HMIS>;

const jtv_hmis_setting = (setting?: JtvHmisSettingParams) =>
  invoke<STORE.JTV_HMIS>(channel.jtv_hmis_setting, setting);

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

const kh_hmis_sqlite_get = (params: KhBarcodeGetParams) =>
  invoke<KhBarcodeGetResult>(channel.kh_hmis_sqlite_get, params);

const kh_hmis_sqlite_delete = (id: number) =>
  invoke<SCHEMA.KhBarcode>(channel.kh_hmis_sqlite_delete, id);

const kh_hmis_api_get = (barcode: string) =>
  invoke<KH_HMIS.GetResponse>(channel.kh_hmis_api_get, barcode);

const kh_hmis_api_set = (id: number) =>
  invoke<SCHEMA.KhBarcode>(channel.kh_hmis_api_set, id);

export type KhHmisSettingParams = Partial<STORE.KH_HMIS>;

const kh_hmis_setting = (setting?: KhHmisSettingParams) =>
  invoke<STORE.KH_HMIS>(channel.kh_hmis_setting, setting);

// Electron 相关函数

const openAtLogin = (open?: boolean) =>
  invoke<boolean>(channel.openAtLogin, open);
const openDevTools = () => invoke(channel.openDevTools);
const openPath = (path: string) => invoke<string>(channel.openPath, path);

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

const getMem: GetMem = () =>
  invoke<{ totalmem: number; freemem: number }>(channel.mem);

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

const mobileMode = (mobile: boolean) =>
  invoke<boolean>(channel.mobileMode, mobile);

export type SetSettingParams = Partial<STORE.Settings>;

const settings = (param?: SetSettingParams) =>
  invoke<STORE.Settings>(channel.settings, param);

const settingsOpenInEditor = () => invoke(channel.settingsOpenInEditor);
const excelQuartor = () => invoke(channel.xlsx_chr_502);
const xlsxCHR501 = () => invoke(channel.xlsx_chr_501);

export type SqliteXlsxSizeRParams = {
  id?: number;
  xlsxName?: string;
  type?: string;
  pageIndex?: number;
  pageSize?: number;
};

const sqliteXlsxSizeR = (params: SqliteXlsxSizeRParams = {}) =>
  invoke<{ count: number; rows: SCHEMA.XlsxSize[] }>(
    channel.sqlite_xlsx_size_r,
    params,
  );

export type SqliteXlsxSizeCParams = {
  xlsxName: string;
  type: string;
  index: string;
  size: number;
}[];

const sqliteXlsxSizeC = (params: SqliteXlsxSizeCParams) =>
  invoke<SCHEMA.XlsxSize[]>(channel.sqlite_xlsx_size_c, params);

export type SqliteXlsxSizeUParams = {
  id: number;
  xlsxName?: string;
  type: string;
  index: string;
  size: number;
};

const sqliteXlsxSizeU = (params: SqliteXlsxSizeUParams) =>
  invoke<SCHEMA.XlsxSize[]>(channel.sqlite_xlsx_size_u, params);

export type SqliteXlsxSizeDParams = {
  id: number;
};

const sqliteXlsxSizeD = (params: SqliteXlsxSizeDParams) =>
  invoke<SCHEMA.XlsxSize[]>(channel.sqlite_xlsx_size_d, params);

const electronAPI = {
  // Windows 10
  verifyActivation,

  // C# Driver
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
  getPathForFile: webUtils.getPathForFile,
  getMem,
  mobileMode,

  // Common
  settings,
  settingsOpenInEditor,
  excelQuartor,
  xlsxCHR501,

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

  // SQLite
  sqliteXlsxSizeC,
  sqliteXlsxSizeU,
  sqliteXlsxSizeR,
  sqliteXlsxSizeD,
};

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
contextBridge.exposeInMainWorld("electron", electron);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
    electron: ElectronAPI;
  }

  // interface ImportMeta {
  //   myname: string;
  // }

  // interface ImportMetaEnv {
  //   myname: string;
  // }
}
