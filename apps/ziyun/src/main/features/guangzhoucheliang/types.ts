import type { InsertRecordParams, SQLiteGetParams } from "#shared/types";
import type { Guangzhoucheliang } from "./guangzhoucheliang";

export interface AlexData {
  /**
   * 轮轴唯一ID，单号
   */
  DH: string;
  /**
   * 轴号
   */
  ZH: string;
  /**
   * 轴型
   */
  ZX: string;
  /**@abstract
   * 收入单位
   */
  SRDW: string;
  /**@description
   * 收入原因
   */
  SRYY: string;
  /**@description
   * 车轴制造单位
   */
  CZZZDW: string;
  /**@description
   * 车轴制造日期
   */
  CZZZRQ: string;
  /**@description
   * 首次组装单位
   */
  SCZZDW: string;
  /**@description
   * 首次组装日期
   */
  SCZZRQ: string;
  /**@abstract
   * 末次组装单位
   */
  MCZZDW: string;
  /** @description
   * 末次组装日期
   */
  MCZZRQ: string;
}

export interface UploadInput {
  /**@description
   * 设备编号	不能为空
   */
  EQ_BH: string;
  /**@description
   * 设备电脑IP	不能为空
   */
  EQ_IP: string;
  /**
   * 股道（1，2）
   */
  GD: string;
  /**@abstract
   * 单号（查询接口返回的字段）
   */
  DH: string;
  /**@abstract
   * 轴号
   */
  ZH: string;
  /**@abstract
   * 轴型
   */
  ZX: string;
  /**
   * 探伤方法
   */
  TSFF: string;
  /**@abstract
   * 探伤时间（日期字段）
   */
  TSSJ: string;
  /**
   * 缺陷部位
   */
  TFLAW_PLACE: string;
  /**
   *   缺陷类型;
   */
  TFLAW_TYPE: string;
  /**
   * 处理意见;
   */
  TVIEW: string;
  /**@abstract
   * 左穿透（车轴穿透）签章
   */
  CZCTZ: string;
  /**
   * 右穿透（车轴穿透）签章
   */
  CZCTY: string;
  /**@abstract
   * 左轮座（轮座镶入部）签章
   */
  LZXRBZ: string;
  /**@abstract
   * 右轮座（轮座镶入部）签章
   */
  LZXRBY: string;
  /**@abstract
   * 左轴颈（卸荷槽）签章
   */
  XHCZ: string;
  /**@abstract
   * 右轴颈（卸荷槽）签章
   */
  XHCY: string;
  /**
   * 探伤工左
   */
  TSZ: string;
  /**
   * 探伤工右
   */
  TSZY: string;
  /**@description
   *  探伤结果（合格，不合格）
   */
  CT_RESULT: string;
}

export interface IPC {
  "guangzhoucheliang/barcode/delete": {
    args: [number];
    return: ReturnType<Guangzhoucheliang["handleBarcodeDelete"]>;
  };
  "guangzhoucheliang/barcode/insert": {
    args: [InsertRecordParams];
    return: ReturnType<Guangzhoucheliang["handleBarcodeInsert"]>;
  };
  "guangzhoucheliang/barcode/read": {
    args: [SQLiteGetParams];
    return: ReturnType<Guangzhoucheliang["handleBarcodeRead"]>;
  };
  "guangzhoucheliang/scanner": {
    args: [string];
    return: ReturnType<Guangzhoucheliang["handleScanner"]>;
  };
  "guangzhoucheliang/upload": {
    args: [number];
    return: ReturnType<Guangzhoucheliang["handleUpload"]>;
  };
}