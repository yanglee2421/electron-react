const createEnum = <TTarget extends Record<string, string>>(
  target: TTarget,
) => {
  return new Proxy<TTarget>(target, {
    get(_, prop) {
      if (typeof prop === "symbol") {
        return prop.description;
      }

      return prop;
    },
  });
};

export const channel = createEnum({
  // C# Driver
  autoInputToVC: "",

  // HMIS
  hxzy_hmis_api_get: "",
  hxzy_hmis_api_set: "",
  hxzy_hmis_api_verifies: "",
  hxzy_hmis_setting: "",
  hxzy_hmis_sqlite_get: "",
  hxzy_hmis_sqlite_delete: "",

  jtv_hmis_api_get: "",
  jtv_hmis_api_set: "",
  jtv_hmis_setting: "",
  jtv_hmis_sqlite_get: "",
  jtv_hmis_sqlite_delete: "",

  jtv_hmis_guangzhoubei_api_get: "",
  jtv_hmis_guangzhoubei_api_set: "",
  jtv_hmis_guangzhoubei_setting: "",
  jtv_hmis_guangzhoubei_sqlite_get: "",
  jtv_hmis_guangzhoubei_sqlite_delete: "",
  jtv_hmis_guangzhoubei_sqlite_insert: "",

  jtv_hmis_xuzhoubei_api_get: "",
  jtv_hmis_xuzhoubei_api_set: "",
  jtv_hmis_xuzhoubei_setting: "",
  jtv_hmis_xuzhoubei_sqlite_get: "",
  jtv_hmis_xuzhoubei_sqlite_delete: "",

  kh_hmis_api_get: "",
  kh_hmis_api_set: "",
  kh_hmis_setting: "",
  kh_hmis_sqlite_get: "",
  kh_hmis_sqlite_delete: "",

  // Electron
  log: "",
  openAtLogin: "",
  openDevTools: "",
  openPath: "",
  windowFocus: "",
  windowBlur: "",
  windowShow: "",
  windowHide: "",
  VERSION: "",
  mobileMode: "",
  SELECT_DIRECTORY: "",
  SELECT_FILE: "",
  SHOW_OPEN_DIALOG: "",

  // Common
  settings: "",
  xlsx_chr_502: "",
  xlsx_chr_53a: "",

  // CURD
  sqlite_xlsx_size_c: "",
  sqlite_xlsx_size_u: "",
  sqlite_xlsx_size_r: "",
  sqlite_xlsx_size_d: "",

  XLSX_CHR501: "",
  PROFILE_SET: "",
  PROFILE_GET: "",
  MDB_ROOT_GET: "",
  MDB_APP_GET: "",

  MD5_BACKUP_IMAGE: "",
  MD5_COMPUTE: "",
  XML: "",
  LAB: "",

  SELECT_XML_PDF_FROM_FOLDER: "",
  XML_PDF_COMPUTE: "",
});
