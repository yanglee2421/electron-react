import { ipcMain, BrowserWindow } from "electron";
import { promiseTry } from "#main/lib/polyfill";
import { calculateErrorMessage } from "#main/utils/error";
import type { Profile } from "#main/lib/profile";
import type {
  HxzyBarcode,
  JTVBarcode,
  JTVGuangzhoubeiBarcode,
  JtvXuzhoubeiBarcode,
  KhBarcode,
  XlsxSize,
} from "#main/schema";
import type { MDBPayload, Verify, VerifyData } from "#main/modules/mdb";
import type {
  HXZY_HMIS,
  JTV_HMIS,
  JTV_HMIS_Guangzhoubei,
  JTV_HMIS_XUZHOUBEI,
  KH_HMIS,
} from "#main/lib/store";

export interface IpcContract {
  "PROFILE/GET": {
    args: [];
    return: Profile;
  };
  "PROFILE/SET": {
    args: [Partial<Profile>];
    return: Profile;
  };
  "VERSION/GET": {
    args: [];
    return: Version;
  };
  "APP/OPEN_AT_LOGIN": {
    args: [boolean?];
    return: boolean;
  };
  "APP/OPEN_DEV_TOOLS": {
    args: [];
    return: void;
  };
  "APP/OPEN_PATH": {
    args: [string];
    return: string;
  };
  "APP/MOBILE_MODE": {
    args: [boolean];
    return: boolean;
  };
  "APP/SELECT_DIRECTORY": {
    args: [];
    return: string[];
  };
  "APP/SELECT_FILE": {
    args: [Electron.FileFilter[]];
    return: string[];
  };
  "APP/SHOW_OPEN_DIALOG": {
    args: [Electron.OpenDialogOptions];
    return: string[];
  };
  "HMIS/hxzy_hmis_sqlite_delete": {
    args: [number];
    return: HxzyBarcode;
  };
  "HMIS/hxzy_hmis_api_get": {
    args: [string];
    return: HxzyGetResponse;
  };
  "HMIS/hxzy_hmis_api_set": {
    args: [number];
    return: HxzyBarcode;
  };
  "HMIS/hxzy_hmis_api_verifies": {
    args: [string];
    return: {
      verifies: Verify;
      verifiesData: VerifyData[];
    };
  };
  "HMIS/hxzy_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: RowsResult<HxzyBarcode>;
  };
  "HMIS/hxzy_hmis_setting": {
    args: [Partial<HXZY_HMIS>?];
    return: HXZY_HMIS;
  };
  "HMIS/jtv_hmis_guangzhoubei_api_set": {
    args: [number];
    return: JTVGuangzhoubeiBarcode;
  };
  "HMIS/jtv_hmis_guangzhoubei_sqlite_get": {
    args: [SQLiteGetParams];
    return: RowsResult<JTVGuangzhoubeiBarcode>;
  };
  "HMIS/jtv_hmis_guangzhoubei_sqlite_delete": {
    args: [number];
    return: JTVGuangzhoubeiBarcode;
  };
  "HMIS/jtv_hmis_guangzhoubei_sqlite_insert": {
    args: [InsertRecordParams];
    return: JTVGuangzhoubeiBarcode;
  };
  "HMIS/jtv_hmis_guangzhoubei_api_get": {
    args: [string, boolean?];
    return: NormalizeResponse[];
  };
  "HMIS/jtv_hmis_guangzhoubei_setting": {
    args: [Partial<JTV_HMIS_Guangzhoubei>?];
    return: JTV_HMIS_Guangzhoubei;
  };
  "WIN/autoInputToVC": {
    args: [AutoInputToVCParams];
    return: string;
  };
  "PLC/read_test": {
    args: [string];
    return: PLCReadResult;
  };
  "PLC/write_test": {
    args: [PLCWritePayload];
    return: void;
  };
  "PLC/serialport_list": {
    args: [];
    return: Array<{ path: string }>;
  };
  "HMIS/jtv_hmis_xuzhoubei_sqlite_get": {
    args: [SQLiteGetParams];
    return: RowsResult<JtvXuzhoubeiBarcode>;
  };
  "HMIS/jtv_hmis_xuzhoubei_sqlite_delete": {
    args: [number];
    return: JtvXuzhoubeiBarcode;
  };
  "HMIS/jtv_hmis_xuzhoubei_api_get": {
    args: [string];
    return: XZBGetResponse;
  };
  "HMIS/jtv_hmis_xuzhoubei_api_set": {
    args: [number];
    return: JtvXuzhoubeiBarcode;
  };
  "HMIS/jtv_hmis_xuzhoubei_setting": {
    args: [Partial<JTV_HMIS_XUZHOUBEI>?];
    return: JTV_HMIS_XUZHOUBEI;
  };
  "MDB/MDB_ROOT_GET": {
    args: [MDBPayload];
    return: { total: number; rows: unknown[] };
  };
  "MDB/MDB_APP_GET": {
    args: [MDBPayload];
    return: { total: number; rows: unknown[] };
  };
  "HMIS/jtv_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: RowsResult<JTVBarcode>;
  };
  "HMIS/jtv_hmis_sqlite_delete": {
    args: [number];
    return: JTVBarcode;
  };
  "HMIS/jtv_hmis_sqlite_insert": {
    args: [InsertRecordParams];
    return: JTVBarcode;
  };
  "HMIS/jtv_hmis_api_get": {
    args: [string, boolean?];
    return: JTVNormalizeResponse[];
  };
  "HMIS/jtv_hmis_api_set": {
    args: [number];
    return: JTVBarcode;
  };
  "HMIS/jtv_hmis_setting": {
    args: [Partial<JTV_HMIS>?];
    return: JTV_HMIS;
  };
  "HMIS/kh_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: RowsResult<KhBarcode>;
  };
  "HMIS/kh_hmis_sqlite_delete": {
    args: [number];
    return: KhBarcode;
  };
  "HMIS/kh_hmis_api_get": {
    args: [string];
    return: KHGetResponse;
  };
  "HMIS/kh_hmis_api_set": {
    args: [number];
    return: KhBarcode;
  };
  "HMIS/kh_hmis_setting": {
    args: [Partial<KH_HMIS>?];
    return: KH_HMIS;
  };
  "XML/XML": {
    args: [string];
    return: XMLJSONData;
  };
  "XML/SELECT_XML_PDF_FROM_FOLDER": {
    args: [string[]];
    return: string[];
  };
  "XML/XML_PDF_COMPUTE": {
    args: [string[]];
    return: Invoice[];
  };
  "MD5/MD5_BACKUP_IMAGE": {
    args: [string];
    return: void;
  };
  "MD5/MD5_COMPUTE": {
    args: [string];
    return: Record<string, string>;
  };
  "XLSX/XLSX_CHR501": {
    args: [string];
    return: void;
  };
  "XLSX/xlsx_chr_502": {
    args: [];
    return: void;
  };
  "XLSX/xlsx_chr_53a": {
    args: [string[]];
    return: void;
  };
  "XLSX/sqlite_xlsx_size_c": {
    args: [SqliteXlsxSizeCParams];
    return: XlsxSize[];
  };
  "XLSX/sqlite_xlsx_size_u": {
    args: [SqliteXlsxSizeUParams];
    return: XlsxSize[];
  };
  "XLSX/sqlite_xlsx_size_r": {
    args: [SqliteXlsxSizeRParams?];
    return: RowsResult<XlsxSize>;
  };
  "XLSX/sqlite_xlsx_size_d": {
    args: [number];
    return: XlsxSize[];
  };
}

// Hxzy
export type HxzyGetResponse = {
  code: "200";
  msg: "数据读取成功";
  data: [
    {
      CZZZDW: "048";
      CZZZRQ: "2009-10";
      MCZZDW: "131";
      MCZZRQ: "2018-07-09 00:00:00";
      SCZZDW: "131";
      SCZZRQ: "2018-07-09 00:00:00";
      DH: "91022070168";
      ZH: "67444";
      ZX: "RE2B";
      SRYY: "厂修";
      SRDW: "588";
    },
  ];
};

// Kanghua
export type KHGetResponse = {
  data: {
    mesureId: "A23051641563052";
    zh: "10911";
    zx: "RE2B";
    clbjLeft: "HEZD Ⅱ 18264";
    clbjRight: "HEZD Ⅱ 32744";
    czzzrq: "2003-01-16";
    czzzdw: "673";
    ldszrq: "2014-06-22";
    ldszdw: "673";
    ldmzrq: "2018-04-13";
    ldmzdw: "623";
  };
  code: 200;
  msg: "success";
};

// Tongxing
export type JTVNormalizeResponse = {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZDW: string;
  CZZZRQ: string;
  MCZZDW: string;
  MCZZRQ: string;
  SCZZDW: string;
  SCZZRQ: string;
};

// Xuzhoubei
export type XZBGetResponse = [
  {
    SCZZRQ: "1990-10-19";
    DH: "50409100225";
    SRDW: "504";
    CZZZRQ: "1990-10-01";
    MCZZDW: "921";
    SRRQ: "2009-10-09";
    SRYY: "01";
    CZZZDW: "183";
    MCZZRQ: "2007-05-18";
    ZH: "18426";
    ZX: "RD2";
    SCZZDW: "183";
    ZTX?: null | string;
    YTX?: null | string;
  },
];

// Guangzhoubei
export type NormalizeResponse = {
  DH: string;
  ZH: string;
  ZX: string;
  CZZZDW: string;
  CZZZRQ: string;
  MCZZDW: string;
  MCZZRQ: string;
  SCZZDW: string;
  SCZZRQ: string;
  ZTX: boolean;
  YTX: boolean;
};

export type SQLiteGetParams = {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
};

export type InsertRecordParams = {
  DH: string;
  ZH: string;
  CZZZDW: string;
  CZZZRQ: string;
};

export type AutoInputToVCParams = {
  zx: string;
  zh: string;
  czzzdw: string;
  sczzdw: string;
  mczzdw: string;
  czzzrq: string;
  sczzrq: string;
  mczzrq: string;
  ztx: string;
  ytx: string;
};

export type SqliteXlsxSizeRParams = {
  id?: number;
  xlsxName?: string;
  type?: string;
  pageIndex?: number;
  pageSize?: number;
};

export type SqliteXlsxSizeCParams = {
  xlsxName: string;
  type: string;
  index: string;
  size: number;
}[];

export type SqliteXlsxSizeUParams = {
  id: number;
  xlsxName?: string;
  type: string;
  index: string;
  size: number;
};

export type PLCReadResult = {
  D20: number;
  D21: number;
  D22: number;
  D23: number;
  D300: number;
  D301: number;
  D302: number;
  D303: number;
  D308: number;
  D309: number;
};

export type PLCWritePayload = {
  path: string;

  D300: number;
  D301: number;
  D302: number;
  D303: number;
  D308: number;
  D309: number;
};

export type XMLJSONData = {
  "?xml": string;
  EInvoice: {
    Header: {
      EIid: string;
      EInvoiceTag: string;
      Version: number;
      InherentLabel: {
        InIssuType: {
          LabelCode: string;
          LabelName: string;
        };
        EInvoiceType: {
          LabelCode: number | string;
          LabelName: string;
        };
        GeneralOrSpecialVAT: {
          LabelCode: number | string;
          LabelName: string;
        };
      };
      UndefinedLabel: {
        Label: {
          LabelType: string;
          LabelCode: number | string;
          LabelName: string;
        };
      };
    };
    EInvoiceData: {
      SellerInformation: {
        SellerIdNum: string;
        SellerName: string;
        SellerAddr: string;
        SellerTelNum: string;
        SellerBankName: string;
        SellerBankAccNum: string | number;
      };
      BuyerInformation: {
        BuyerIdNum: string;
        BuyerName: string;
        BuyerBankName: string;
        BuyerBankAccNum: string | number;
        BuyerAddr: string;
        BuyerTelNum: string;
      };
      BasicInformation: {
        TotalAmWithoutTax: number;
        TotalTaxAm: number;
        "TotalTax-includedAmount": number;
        "TotalTax-includedAmountInChinese": string;
        Drawer: string;
        RequestTime: string;
      };
      IssuItemInformation: IssuItemInformation[] | IssuItemInformation;
      SpecificInformation: {
        PassengerTransportation: Array<{
          Departure: string;
          Destination: string;
          Traveler: string;
          ValidIDNumber: string;
          TravelDate: string;
          Grade: string;
          TypeOfPassengerDocument: string;
          Vehicletype: string;
        }>;
      };
      AdditionalInformation:
        | string
        | {
            Remark: string;
          };
    };
    SellerAuthentication: {
      AuthenticationMethods: number | string;
    };
    TaxSupervisionInfo: {
      InvoiceNumber: string;
      IssueTime: string;
      TaxBureauCode: string | number;
      TaxBureauName: string;
    };
  };
};

export type IssuItemInformation = {
  ItemName: string;
  SpecMod: string;
  MeaUnits: string;
  Quantity: number;
  UnPrice: number;
  Amount: number;
  TaxRate: number;
  ComTaxAm: number;
  TotaltaxIncludedAmount: number;
  TaxClassificationCode: string | number;
};

export type Invoice = {
  id: string;
  totalTaxIncludedAmount: string;
  requestTime: string;
  filePath: string;
  itemName?: string;
  additionalInformation?: string;
  pdf: boolean;
  xml: boolean;
};

type CallbackFn<TArgs extends unknown[], TReturn> = (...args: TArgs) => TReturn;

type HandlerFn<K extends keyof IpcContract> = IpcContract[K] extends {
  args: infer A;
  return: infer R;
}
  ? CallbackFn<
      A extends unknown[] ? [Electron.IpcMainInvokeEvent, ...A] : [],
      Promise<R>
    >
  : never;

type RowsResult<TRow> = {
  count: number;
  rows: TRow[];
};

type Version = {
  version: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  v8Version: string;
};

type Log = {
  id: number;
  type: string;
  message: string;
  date: string;
};

export const withLog = <TArgs extends unknown[], TReturn>(
  callback: CallbackFn<TArgs, TReturn>,
) => {
  const resultFn = async (...args: TArgs) => {
    try {
      // Ensure an error is thrown when the promise is rejected
      const result = await promiseTry(callback, ...args);
      return result;
    } catch (error) {
      console.error(error);

      // Log the error message
      const message = calculateErrorMessage(error);
      log(message, "error");
      // Throw message instead of error to avoid electron issue #24427
      throw message;
    }
  };

  return resultFn;
};

export const log = (message: string, type = "info") => {
  const data: Log = {
    id: 0,
    date: new Date().toISOString(),
    message,
    type,
  };

  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send("LOG", data);
  });
};

export const ipcHandle = <TKey extends keyof IpcContract>(
  key: TKey,
  listener: HandlerFn<TKey>,
) => {
  return ipcMain.handle(key, withLog(listener));
};
