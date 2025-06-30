import { ipcRenderer, webUtils, contextBridge } from "electron";
const verifyActivation$1 = "verifyActivation";
const getDataFromAccessDatabase$1 = "getDataFromAccessDatabase";
const autoInputToVC$1 = "autoInputToVC";
const hxzy_hmis_api_get$1 = "hxzy_hmis_get_data";
const hxzy_hmis_api_set$1 = "hxzy_hmis_save_data";
const hxzy_hmis_api_verifies$1 = "hxzy_hmis_upload_verifies";
const hxzy_hmis_setting$1 = "hxzy_hmis_setting";
const hxzy_hmis_sqlite_get$1 = "hxzy_hmis_sqlite_get";
const hxzy_hmis_sqlite_delete$1 = "hxzy_hmis_sqlite_delete";
const jtv_hmis_api_get$1 = "jtv_hmis_get_data";
const jtv_hmis_api_set$1 = "jtv_hmis_save_data";
const jtv_hmis_setting$1 = "jtv_hmis_setting";
const jtv_hmis_sqlite_get$1 = "jtv_hmis_sqlite_get";
const jtv_hmis_sqlite_delete$1 = "jtv_hmis_sqlite_delete";
const jtv_hmis_xuzhoubei_api_get$1 = "jtv_hmis_xuzhoubei_get_data";
const jtv_hmis_xuzhoubei_api_set$1 = "jtv_hmis_xuzhoubei_save_data";
const jtv_hmis_xuzhoubei_setting$1 = "jtv_hmis_xuzhoubei_setting";
const jtv_hmis_xuzhoubei_sqlite_get$1 = "jtv_hmis_xuzhoubei_sqlite_get";
const jtv_hmis_xuzhoubei_sqlite_delete$1 = "jtv_hmis_xuzhoubei_sqlite_delete";
const kh_hmis_api_get$1 = "kh_hmis_get_data";
const kh_hmis_api_set$1 = "kh_hmis_save_data";
const kh_hmis_setting$1 = "kh_hmis_setting";
const kh_hmis_sqlite_get$1 = "kh_hmis_sqlite_get";
const kh_hmis_sqlite_delete$1 = "kh_hmis_sqlite_delete";
const log = "log";
const mem = "mem";
const openAtLogin$1 = "openAtLogin";
const openDevTools$1 = "openDevTools";
const openPath$1 = "openPath";
const windowFocus = "windowFocus";
const windowBlur = "windowBlur";
const windowShow = "windowShow";
const windowHide = "windowHide";
const getVersion$1 = "getVersion";
const mobileMode$1 = "mobileMode";
const settings$1 = "settings";
const settingsOpenInEditor$1 = "settingsOpenInEditor";
const xlsx_chr_501 = "excel:verify";
const xlsx_chr_502 = "excel:quartor";
const xlsx_chr_53a = "excel:detection";
const sqlite_xlsx_size_c = "sqlite:xlsxSize:create";
const sqlite_xlsx_size_u = "sqlite:xlsxSize:update";
const sqlite_xlsx_size_r = "sqlite:xlsxSize:read";
const sqlite_xlsx_size_d = "sqlite:xlsxSize:delete";
const invoke = ipcRenderer.invoke;
const verifyActivation = () => invoke(verifyActivation$1);
const getDataFromAccessDatabase = (sql) => invoke(getDataFromAccessDatabase$1, sql);
const autoInputToVC = (params) => invoke(autoInputToVC$1, params);
const hxzy_hmis_sqlite_get = (params) => invoke(hxzy_hmis_sqlite_get$1, params);
const hxzy_hmis_sqlite_delete = (id) => invoke(hxzy_hmis_sqlite_delete$1, id);
const hxzy_hmis_api_get = (barcode) => invoke(hxzy_hmis_api_get$1, barcode);
const hxzy_hmis_api_set = (id) => invoke(hxzy_hmis_api_set$1, id);
const hxzy_hmis_api_verifies = (id) => invoke(hxzy_hmis_api_verifies$1, id);
const hxzy_hmis_setting = (setting) => invoke(hxzy_hmis_setting$1, setting);
const jtv_hmis_xuzhoubei_sqlite_get = (params) => invoke(
  jtv_hmis_xuzhoubei_sqlite_get$1,
  params
);
const jtv_hmis_xuzhoubei_sqlite_delete = (id) => invoke(
  jtv_hmis_xuzhoubei_sqlite_delete$1,
  id
);
const jtv_hmis_xuzhoubei_api_get = (barcode) => invoke(
  jtv_hmis_xuzhoubei_api_get$1,
  barcode
);
const jtv_hmis_xuzhoubei_api_set = (id) => invoke(jtv_hmis_xuzhoubei_api_set$1, id);
const jtv_hmis_xuzhoubei_setting = (setting) => invoke(jtv_hmis_xuzhoubei_setting$1, setting);
const jtv_hmis_sqlite_get = (params) => invoke(jtv_hmis_sqlite_get$1, params);
const jtv_hmis_sqlite_delete = (id) => invoke(jtv_hmis_sqlite_delete$1, id);
const jtv_hmis_api_get = (barcode) => invoke(jtv_hmis_api_get$1, barcode);
const jtv_hmis_api_set = async (id) => {
  await invoke(jtv_hmis_api_set$1, id);
  return id;
};
const jtv_hmis_setting = (setting) => invoke(jtv_hmis_setting$1, setting);
const kh_hmis_sqlite_get = (params) => invoke(kh_hmis_sqlite_get$1, params);
const kh_hmis_sqlite_delete = (id) => invoke(kh_hmis_sqlite_delete$1, id);
const kh_hmis_api_get = (barcode) => invoke(kh_hmis_api_get$1, barcode);
const kh_hmis_api_set = (id) => invoke(kh_hmis_api_set$1, id);
const kh_hmis_setting = (setting) => invoke(kh_hmis_setting$1, setting);
const openAtLogin = (open) => invoke(openAtLogin$1, open);
const openDevTools = () => invoke(openDevTools$1);
const openPath = (path) => invoke(openPath$1, path);
const subscribeLog = (handler) => {
  const listener = (event, data) => {
    handler(data);
  };
  ipcRenderer.on(log, listener);
  return () => {
    ipcRenderer.off(log, listener);
  };
};
const getMem = () => invoke(mem);
const createSubscribe = (channel2) => {
  return (handler) => {
    const listener = () => handler();
    ipcRenderer.on(channel2, listener);
    return () => {
      ipcRenderer.off(channel2, listener);
    };
  };
};
const subscribeWindowFocus = createSubscribe(windowFocus);
const subscribeWindowBlur = createSubscribe(windowBlur);
const subscribeWindowShow = createSubscribe(windowShow);
const subscribeWindowHide = createSubscribe(windowHide);
const subscribeHxzyHmisAPISet = createSubscribe(hxzy_hmis_api_set$1);
const subscribeJtvHmisAPISet = createSubscribe(jtv_hmis_api_set$1);
const subscribeKhHmisAPISet = createSubscribe(kh_hmis_api_set$1);
const subscribeJtvHmisXuzhoubeiAPISet = createSubscribe(
  jtv_hmis_xuzhoubei_api_set$1
);
const getVersion = () => invoke(getVersion$1);
const mobileMode = (mobile) => invoke(mobileMode$1, mobile);
const settings = (param) => invoke(settings$1, param);
const settingsOpenInEditor = () => invoke(settingsOpenInEditor$1);
const excelQuartor = () => invoke(xlsx_chr_502);
const xlsxCHR53A = () => invoke(xlsx_chr_53a);
const xlsxCHR501 = () => invoke(xlsx_chr_501);
const sqliteXlsxSizeR = (params = {}) => invoke(
  sqlite_xlsx_size_r,
  params
);
const sqliteXlsxSizeC = (params) => invoke(sqlite_xlsx_size_c, params);
const sqliteXlsxSizeU = (params) => invoke(sqlite_xlsx_size_u, params);
const sqliteXlsxSizeD = (params) => invoke(sqlite_xlsx_size_d, params);
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
  getPathForFile: webUtils.getPathForFile,
  getMem,
  getVersion,
  mobileMode,
  // Common
  settings,
  settingsOpenInEditor,
  excelQuartor,
  xlsxCHR53A,
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
  sqliteXlsxSizeD
};
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
export {
  hxzy_hmis_sqlite_get
};
