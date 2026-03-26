import type { XlsxSize } from "#main/db/schema";
import type * as win from "#main/modules/cmd";
import type { MDBPayload } from "#main/modules/mdb";
import type * as guangzhoubei from "#main/shared/factories/hmis/guangzhoubei";
import type * as guangzhoujibaoduan from "#main/shared/factories/hmis/guangzhoujibaoduan";
import type * as hxzy from "#main/shared/factories/hmis/hxzy";
import type * as jtv from "#main/shared/factories/hmis/jtv";
import type * as kh from "#main/shared/factories/hmis/kh_hmis";
import type * as xuzhoubei from "#main/shared/factories/hmis/xuzhoubei";
import type * as kv from "#main/shared/factories/KV";
import type * as logger from "#main/shared/factories/Logger";
import { calculateErrorMessage } from "#shared/functions/error";
import { promiseTry } from "@yotulee/run";
import { ipcMain } from "electron";

export interface IpcContract
  extends
    kv.IpcContract,
    hxzy.Ipc,
    kh.Ipc,
    jtv.Ipc,
    guangzhoubei.Ipc,
    guangzhoujibaoduan.IpcContract,
    xuzhoubei.Ipc,
    win.Ipc,
    logger.IPC {
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
  "MDB/MDB_ROOT_GET": {
    args: [MDBPayload];
    return: { total: number; rows: unknown[] };
  };
  "MDB/MDB_APP_GET": {
    args: [MDBPayload];
    return: { total: number; rows: unknown[] };
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
  "DB/EXPORT": {
    args: [];
    return: void;
  };
}

export interface SQLiteGetParams {
  pageIndex: number;
  pageSize: number;
  startDate: string;
  endDate: string;
}

export interface InsertRecordParams {
  DH: string;
  ZH: string;
  CZZZDW: string;
  CZZZRQ: string;
}

export interface SqliteXlsxSizeRParams {
  id?: number;
  xlsxName?: string;
  type?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface SqliteXlsxSizeCParam {
  xlsxName: string;
  type: string;
  index: string;
  size: number;
}

export type SqliteXlsxSizeCParams = SqliteXlsxSizeCParam[];

export interface SqliteXlsxSizeUParams {
  id: number;
  xlsxName?: string;
  type: string;
  index: string;
  size: number;
}

export interface PLCReadResult {
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
}

export interface PLCWritePayload {
  path: string;

  D300: number;
  D301: number;
  D302: number;
  D303: number;
  D308: number;
  D309: number;
}

export interface XMLJSONData {
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
}

export interface IssuItemInformation {
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
}

export interface Invoice {
  id: string;
  totalTaxIncludedAmount: string;
  requestTime: string;
  filePath: string;
  itemName?: string;
  additionalInformation?: string;
  pdf: boolean;
  xml: boolean;
}

type HandlerFn<K extends keyof IpcContract> = IpcContract[K] extends {
  args: infer A;
  return: infer R;
}
  ? (
      ...args: A extends unknown[]
        ? [Electron.IpcMainInvokeEvent, ...A]
        : [Electron.IpcMainInvokeEvent]
    ) => Promise<Awaited<R>>
  : never;

type IPCArgs<TKey extends keyof IpcContract> = IpcContract[TKey] extends {
  args: infer A;
}
  ? A extends unknown[]
    ? [Electron.IpcMainInvokeEvent, ...A]
    : [Electron.IpcMainInvokeEvent]
  : never;

type RowsResult<TRow> = {
  count: number;
  rows: TRow[];
};

export interface Version {
  version: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
  v8Version: string;
}

export type IpcHandle = <TKey extends keyof IpcContract>(
  key: TKey,
  listener: HandlerFn<TKey>,
) => void;

export class IPCHandle {
  private logger: logger.Logger;

  constructor(logger: logger.Logger) {
    this.logger = logger;
  }

  handle<TKey extends keyof IpcContract>(key: TKey, listener: HandlerFn<TKey>) {
    return ipcMain.handle(key, async (...args) => {
      try {
        // Must await the result to catch the error,
        // otherwise the error will be unhandled and crash the app
        const $args = args as IPCArgs<TKey>;
        const result = await promiseTry(listener, ...$args);

        return result;
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error({
            title: error.message,
            message: error.stack,
          });
        }

        throw calculateErrorMessage(error);
      }
    });
  }
}
