class ID {
  counter = 0;
  get() {
    return String(++this.counter);
  }
}

const id = new ID();

// Windows 10
export const printer = id.get();
export const verifyActivation = id.get();

// C# Driver
export const getDataFromAccessDatabase = id.get();
export const autoInputToVC = id.get();

// HMIS
export const hxzy_hmis_api_get = id.get();
export const hxzy_hmis_api_set = id.get();
export const hxzy_hmis_api_verifies = id.get();
export const hxzy_hmis_setting = id.get();
export const hxzy_hmis_sqlite_get = id.get();
export const hxzy_hmis_sqlite_delete = id.get();

export const jtv_hmis_api_get = id.get();
export const jtv_hmis_api_set = id.get();
export const jtv_hmis_setting = id.get();
export const jtv_hmis_sqlite_get = id.get();
export const jtv_hmis_sqlite_delete = id.get();

export const jtv_hmis_xuzhoubei_api_get = id.get();
export const jtv_hmis_xuzhoubei_api_set = id.get();
export const jtv_hmis_xuzhoubei_setting = id.get();
export const jtv_hmis_xuzhoubei_sqlite_get = id.get();
export const jtv_hmis_xuzhoubei_sqlite_delete = id.get();

export const kh_hmis_api_get = id.get();
export const kh_hmis_api_set = id.get();
export const kh_hmis_setting = id.get();
export const kh_hmis_sqlite_get = id.get();
export const kh_hmis_sqlite_delete = id.get();

// Electron
export const log = id.get();
export const mem = id.get();
export const openAtLogin = id.get();
export const openDevTools = id.get();
export const openPath = id.get();
export const windowFocus = id.get();
export const windowBlur = id.get();
export const windowShow = id.get();
export const windowHide = id.get();
export const getVersion = id.get();
export const mobileMode = id.get();

// Common
export const settings = id.get();
export const settingsOpenInEditor = id.get();
export const xlsx_chr_501 = id.get();
export const xlsx_chr_502 = id.get();
export const xlsx_chr_53a = id.get();

// CURD
export const sqlite_xlsx_size_c = id.get();
export const sqlite_xlsx_size_u = id.get();
export const sqlite_xlsx_size_r = id.get();
export const sqlite_xlsx_size_d = id.get();

const createProxy = <TTarget extends NonNullable<unknown>>(target: TTarget) => {
  return new Proxy<TTarget>(target, {
    get(_, prop) {
      if (typeof prop === "symbol") {
        return prop.description;
      }

      return prop;
    },
  });
};

export const channel = createProxy({
  sqlite_xlsx_size_c: ++i,
});
