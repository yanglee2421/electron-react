// 康华 安康
import type { SQLiteDBType } from "#main/db";
import * as schema from "#main/db/schema";
import { createEmit } from "#main/lib";
import type {
  InsertRecordParams,
  IpcHandle,
  SQLiteGetParams,
} from "#main/lib/ipc";
import { log } from "#main/lib/ipc";
import type {
  MDBDB,
  Quartor,
  QuartorData,
  Verify,
  VerifyData,
} from "#main/modules/mdb";
import type { Net } from "#main/shared/factories/hmis/hmis";
import { HMIS } from "#main/shared/factories/hmis/hmis";
import type { KV } from "#main/shared/factories/KV";
import {
  calculateJY,
  calculateNAtten,
  calculateNAttenDiff,
  calculateTS,
  calculateZSJ,
  isCTFlaw,
  isLeftFlaw,
  isLZFlaw,
  isRightFlaw,
  isXHCFlaw,
  resolveLzFlaws,
  resolveQuartorResult,
} from "#shared/functions/flawDetection";
import { KH_HMIS_STORAGE_KEY } from "#shared/instances/constants";
import type { KH_HMIS } from "#shared/instances/schema";
import { kh_hmis } from "#shared/instances/schema";
import { mapGroupBy } from "@yotulee/run";
import dayjs from "dayjs";
import * as sql from "drizzle-orm";
import pLimit from "p-limit";

interface CHR501InputParams {
  sbbh: string;
  sbmc: string;
  ggxh: string;
  zzcj: string;
  dwmc: string;
  jyrq: string;
  swmkxh: string;
  zlz_zsj1: string;
  zlz_zsj2: string;
  zlz_zsj3: string;
  zlz_zsj4: string;
  zlz_zsj5: string;
  zlz_zsj6: string;
  zlz_zsj7: string;
  zlz_zsj8: string;
  zlz_zsj9: string;
  zlz_zsj10: string;
  zlz_zsj11: string;
  zlz_jy1: string;
  zlz_jy2: string;
  zlz_jy3: string;
  zlz_jy4: string;
  zlz_jy5: string;
  zlz_jy6: string;
  zlz_jy7: string;
  zlz_jy8: string;
  zlz_jy9: string;
  zlz_jy10: string;
  zlz_jy11: string;
  zlz_ts1: string;
  zlz_ts2: string;
  zlz_ts3: string;
  zlz_ts4: string;
  zlz_ts5: string;
  zlz_ts6: string;
  zlz_ts7: string;
  zlz_ts8: string;
  zlz_ts9: string;
  zlz_ts10: string;
  zlz_ts11: string;
  zlz_qx1_1: string;
  zlz_qx1_2: string;
  zlz_qx2_1: string;
  zlz_qx2_2: string;
  zlz_qx2_3: string;
  zlz_qx3_1: string;
  zlz_qx3_3: string;
  zlz_qx3_4: string;
  zlz_qx4_1: string;
  zlz_qx4_4: string;
  zlz_qx4_5: string;
  zlz_qx5_1: string;
  zlz_qx5_5: string;
  zlz_qx5_6: string;
  zlz_qx6_1: string;
  zlz_qx6_6: string;
  zlz_qx6_7: string;
  zlz_qx7_1: string;
  zlz_qx7_7: string;
  zlz_qx7_8: string;
  zlz_qx8_1: string;
  zlz_qx8_8: string;
  zlz_qx8_9: string;
  zlz_qx9_1: string;
  zlz_qx9_9: string;
  zlz_qx9_10: string;
  zlz_qx10_1: string;
  zlz_qx10_10: string;
  zlz_qx10_11: string;
  zlz_qx11_1: string;
  zlz_qx11_11: string;
  ylz_zsj1: string;
  ylz_zsj2: string;
  ylz_zsj3: string;
  ylz_zsj4: string;
  ylz_zsj5: string;
  ylz_zsj6: string;
  ylz_zsj7: string;
  ylz_zsj8: string;
  ylz_zsj9: string;
  ylz_zsj10: string;
  ylz_zsj11: string;
  ylz_jy1: string;
  ylz_jy2: string;
  ylz_jy3: string;
  ylz_jy4: string;
  ylz_jy5: string;
  ylz_jy6: string;
  ylz_jy7: string;
  ylz_jy8: string;
  ylz_jy9: string;
  ylz_jy10: string;
  ylz_jy11: string;
  ylz_ts1: string;
  ylz_ts2: string;
  ylz_ts3: string;
  ylz_ts4: string;
  ylz_ts5: string;
  ylz_ts6: string;
  ylz_ts7: string;
  ylz_ts8: string;
  ylz_ts9: string;
  ylz_ts10: string;
  ylz_ts11: string;
  ylz_qx1_1: string;
  ylz_qx1_2: string;
  ylz_qx2_1: string;
  ylz_qx2_2: string;
  ylz_qx2_3: string;
  ylz_qx3_1: string;
  ylz_qx3_3: string;
  ylz_qx3_4: string;
  ylz_qx4_1: string;
  ylz_qx4_4: string;
  ylz_qx4_5: string;
  ylz_qx5_1: string;
  ylz_qx5_5: string;
  ylz_qx5_6: string;
  ylz_qx6_1: string;
  ylz_qx6_6: string;
  ylz_qx6_7: string;
  ylz_qx7_1: string;
  ylz_qx7_7: string;
  ylz_qx7_8: string;
  ylz_qx8_1: string;
  ylz_qx8_8: string;
  ylz_qx8_9: string;
  ylz_qx9_1: string;
  ylz_qx9_9: string;
  ylz_qx9_10: string;
  ylz_qx10_1: string;
  ylz_qx10_10: string;
  ylz_qx10_11: string;
  ylz_qx11_1: string;
  ylz_qx11_11: string;
  zzj_zsj: string;
  zzj_jy: string;
  zzj_ts: string;
  zzj_qx1: string;
  zzj_qx2: string;
  zzj_qx3: string;
  zct_zsj: string;
  zct_jy: string;
  zct_ts: string;
  zct_qx: string;
  yzj_zsj: string;
  yzj_jy: string;
  yzj_ts: string;
  yzj_qx1: string;
  yzj_qx2: string;
  yzj_qx3: string;
  yct_zsj: string;
  yct_jy: string;
  yct_ts: string;
  yct_qx: string;
  czz: string;
  gz: string;
  wxg: string;
  zjy: string;
  ysy: string;
  bz: string;
}

interface CHR502InputParams {
  /**
   * 写入时间
   * 数据库类型: DATE
   * 是否允许为空: 否
   */
  xrsj: string;

  /**
   * 设备编号
   * 数据库类型: VARCHAR2
   * 是否允许为空: 否
   */
  sbbh: string;

  /**
   * 设备名称
   * 数据库类型: VARCHAR2
   * 是否允许为空: 否
   */
  sbmc: string;

  /**
   * 单位名称
   * 数据库类型: VARCHAR2
   * 是否允许为空: 否
   */
  dwmc: string;

  /**
   * 制造时间
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zzsj: string;

  /**
   * 制造单位
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zzdw: string;

  /**
   * 上次检修时间
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  scjxsj: string;

  /**
   * 校验日期
   * 数据库类型: VARCHAR2
   * 是否允许为空: 否
   */
  jyrq: string;

  /**
   * 轴颈根部 1 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_11_z: string;

  /**
   * 轴颈根部 1 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_11_y: string;

  /**
   * 轴颈根部 1 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_12_z: string;

  /**
   * 轴颈根部 1 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_12_y: string;

  /**
   * 轴颈根部 1 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_13_z: string;

  /**
   * 轴颈根部 1 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_13_y: string;

  /**
   * 轴颈根部 1 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_14_z: string;

  /**
   * 轴颈根部 1 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_14_y: string;

  /**
   * 轴颈根部 1 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_15_z: string;

  /**
   * 轴颈根部 1 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_15_y: string;

  /**
   * 轴颈根部 1 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_1cz_z: string;

  /**
   * 轴颈根部 1 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_1cz_y: string;

  /**
   * 轴颈根部 1 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_1jg: string;

  /**
   * 轴颈根部 2 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_21_z: string;

  /**
   * 轴颈根部 2 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_21_y: string;

  /**
   * 轴颈根部 2 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_22_z: string;

  /**
   * 轴颈根部 2 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_22_y: string;

  /**
   * 轴颈根部 2 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_23_z: string;

  /**
   * 轴颈根部 2 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_23_y: string;

  /**
   * 轴颈根部 2 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_24_z: string;

  /**
   * 轴颈根部 2 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_24_y: string;

  /**
   * 轴颈根部 2 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_25_z: string;

  /**
   * 轴颈根部 2 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_25_y: string;

  /**
   * 轴颈根部 2 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_2cz_z: string;

  /**
   * 轴颈根部 2 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_2cz_y: string;

  /**
   * 轴颈根部 2 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_2jg: string;

  /**
   * 轴颈根部 3 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_31_z: string;

  /**
   * 轴颈根部 3 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_31_y: string;

  /**
   * 轴颈根部 3 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_32_z: string;

  /**
   * 轴颈根部 3 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_32_y: string;

  /**
   * 轴颈根部 3 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_33_z: string;

  /**
   * 轴颈根部 3 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_33_y: string;

  /**
   * 轴颈根部 3 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_34_z: string;

  /**
   * 轴颈根部 3 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_34_y: string;

  /**
   * 轴颈根部 3 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_35_z: string;

  /**
   * 轴颈根部 3 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_35_y: string;

  /**
   * 轴颈根部 3 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_3cz_z: string;

  /**
   * 轴颈根部 3 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_3cz_y: string;

  /**
   * 轴颈根部 3 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjgb_3jg: string;

  /**
   * 轮座镶入部1 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_11_z: string;

  /**
   * 轮座镶入部1 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_11_y: string;

  /**
   * 轮座镶入部1 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_12_z: string;

  /**
   * 轮座镶入部1 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_12_y: string;

  /**
   * 轮座镶入部1 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_13_z: string;

  /**
   * 轮座镶入部1 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_13_y: string;

  /**
   * 轮座镶入部1 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_14_z: string;

  /**
   * 轮座镶入部1 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_14_y: string;

  /**
   * 轮座镶入部1 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_15_z: string;

  /**
   * 轮座镶入部1 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_15_y: string;

  /**
   * 轮座镶入部1 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_1cz_z: string;

  /**
   * 轮座镶入部1 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_1cz_y: string;

  /**
   * 轮座镶入部1 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_1jg: string;

  /**
   * 轮座镶入部2 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_21_z: string;

  /**
   * 轮座镶入部2 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_21_y: string;

  /**
   * 轮座镶入部2 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_22_z: string;

  /**
   * 轮座镶入部2 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_22_y: string;

  /**
   * 轮座镶入部2 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_23_z: string;

  /**
   * 轮座镶入部2 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_23_y: string;

  /**
   * 轮座镶入部2 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_24_z: string;

  /**
   * 轮座镶入部2 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_24_y: string;

  /**
   * 轮座镶入部2 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_25_z: string;

  /**
   * 轮座镶入部2 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_25_y: string;

  /**
   * 轮座镶入部2 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_2cz_z: string;

  /**
   * 轮座镶入部2 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_2cz_y: string;

  /**
   * 轮座镶入部2 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_2jg: string;

  /**
   * 轮座镶入部3 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_31_z: string;

  /**
   * 轮座镶入部3 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_31_y: string;

  /**
   * 轮座镶入部3 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_32_z: string;

  /**
   * 轮座镶入部3 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_32_y: string;

  /**
   * 轮座镶入部3 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_33_z: string;

  /**
   * 轮座镶入部3 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_33_y: string;

  /**
   * 轮座镶入部3 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_34_z: string;

  /**
   * 轮座镶入部3 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_34_y: string;

  /**
   * 轮座镶入部3 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_35_z: string;

  /**
   * 轮座镶入部3 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_35_y: string;

  /**
   * 轮座镶入部3 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_3cz_z: string;

  /**
   * 轮座镶入部3 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_3cz_y: string;

  /**
   * 轮座镶入部3 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_3jg: string;

  /**
   * 轮座镶入部4 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_41_z: string;

  /**
   * 轮座镶入部4 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_41_y: string;

  /**
   * 轮座镶入部4 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_42_z: string;

  /**
   * 轮座镶入部4 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_42_y: string;

  /**
   * 轮座镶入部4 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_43_z: string;

  /**
   * 轮座镶入部4 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_43_y: string;

  /**
   * 轮座镶入部4 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_44_z: string;

  /**
   * 轮座镶入部4 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_44_y: string;

  /**
   * 轮座镶入部4 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_45_z: string;

  /**
   * 轮座镶入部4 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_45_y: string;

  /**
   * 轮座镶入部4 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_4cz_z: string;

  /**
   * 轮座镶入部4 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_4cz_y: string;

  /**
   * 轮座镶入部4 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_4jg: string;

  /**
   * 轮座镶入部5 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_51_z: string;

  /**
   * 轮座镶入部5 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_51_y: string;

  /**
   * 轮座镶入部5 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_52_z: string;

  /**
   * 轮座镶入部5 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_52_y: string;

  /**
   * 轮座镶入部5 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_53_z: string;

  /**
   * 轮座镶入部5 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_53_y: string;

  /**
   * 轮座镶入部5 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_54_z: string;

  /**
   * 轮座镶入部5 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_54_y: string;

  /**
   * 轮座镶入部5 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_55_z: string;

  /**
   * 轮座镶入部5 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_55_y: string;

  /**
   * 轮座镶入部5 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_5cz_z: string;

  /**
   * 轮座镶入部5 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_5cz_y: string;

  /**
   * 轮座镶入部5 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_5jg: string;

  /**
   * 轮座镶入部6 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_61_z: string;

  /**
   * 轮座镶入部6 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_61_y: string;

  /**
   * 轮座镶入部6 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_62_z: string;

  /**
   * 轮座镶入部6 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_62_y: string;

  /**
   * 轮座镶入部6 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_63_z: string;

  /**
   * 轮座镶入部6 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_63_y: string;

  /**
   * 轮座镶入部6 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_64_z: string;

  /**
   * 轮座镶入部6 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_64_y: string;

  /**
   * 轮座镶入部6 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_65_z: string;

  /**
   * 轮座镶入部6 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_65_y: string;

  /**
   * 轮座镶入部6 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_6cz_z: string;

  /**
   * 轮座镶入部6 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_6cz_y: string;

  /**
   * 轮座镶入部6 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_6jg: string;

  /**
   * 轮座镶入部7 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_71_z: string;

  /**
   * 轮座镶入部7 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_71_y: string;

  /**
   * 轮座镶入部7 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_72_z: string;

  /**
   * 轮座镶入部7 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_72_y: string;

  /**
   * 轮座镶入部7 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_73_z: string;

  /**
   * 轮座镶入部7 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_73_y: string;

  /**
   * 轮座镶入部7 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_74_z: string;

  /**
   * 轮座镶入部7 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_74_y: string;

  /**
   * 轮座镶入部7 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_75_z: string;

  /**
   * 轮座镶入部7 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_75_y: string;

  /**
   * 轮座镶入部7 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_7cz_z: string;

  /**
   * 轮座镶入部7 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_7cz_y: string;

  /**
   * 轮座镶入部7 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_7jg: string;

  /**
   * 轮座镶入部8 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_81_z: string;

  /**
   * 轮座镶入部8 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_81_y: string;

  /**
   * 轮座镶入部8 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_82_z: string;

  /**
   * 轮座镶入部8 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_82_y: string;

  /**
   * 轮座镶入部8 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_83_z: string;

  /**
   * 轮座镶入部8 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_83_y: string;

  /**
   * 轮座镶入部8 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_84_z: string;

  /**
   * 轮座镶入部8 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_84_y: string;

  /**
   * 轮座镶入部8 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_85_z: string;

  /**
   * 轮座镶入部8 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_85_y: string;

  /**
   * 轮座镶入部8 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_8cz_z: string;

  /**
   * 轮座镶入部8 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_8cz_y: string;

  /**
   * 轮座镶入部8结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_8jg: string;

  /**
   * 轮座镶入部9 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_91_z: string;

  /**
   * 轮座镶入部9 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_91_y: string;

  /**
   * 轮座镶入部9 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_92_z: string;

  /**
   * 轮座镶入部9 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_92_y: string;

  /**
   * 轮座镶入部9 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_93_z: string;

  /**
   * 轮座镶入部9 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_93_y: string;

  /**
   * 轮座镶入部9 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_94_z: string;

  /**
   * 轮座镶入部9 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_94_y: string;

  /**
   * 轮座镶入部9 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_95_z: string;

  /**
   * 轮座镶入部9 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_95_y: string;

  /**
   * 轮座镶入部9 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_9cz_z: string;

  /**
   * 轮座镶入部9 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_9cz_y: string;

  /**
   * 轮座镶入部9 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_9jg: string;

  /**
   * 轮座镶入部10第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_101_z: string;

  /**
   * 轮座镶入部10第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_101_y: string;

  /**
   * 轮座镶入部10第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_102_z: string;

  /**
   * 轮座镶入部10第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_102_y: string;

  /**
   * 轮座镶入部10第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_103_z: string;

  /**
   * 轮座镶入部10第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_103_y: string;

  /**
   * 轮座镶入部10第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_104_z: string;

  /**
   * 轮座镶入部10第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_104_y: string;

  /**
   * 轮座镶入部10第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_105_z: string;

  /**
   * 轮座镶入部10第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_105_y: string;

  /**
   * 轮座镶入部10 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_10cz_z: string;

  /**
   * 轮座镶入部10 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_10cz_y: string;

  /**
   * 轮座镶入部10 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_10jg: string;

  /**
   * 轮座镶入部11第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_111_z: string;

  /**
   * 轮座镶入部11第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_111_y: string;

  /**
   * 轮座镶入部11第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_112_z: string;

  /**
   * 轮座镶入部11第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_112_y: string;

  /**
   * 轮座镶入部11第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_113_z: string;

  /**
   * 轮座镶入部11第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_113_y: string;

  /**
   * 轮座镶入部11第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_114_z: string;

  /**
   * 轮座镶入部11第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_114_y: string;

  /**
   * 轮座镶入部11第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_115_z: string;

  /**
   * 轮座镶入部11第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_115_y: string;

  /**
   * 轮座镶入部11 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_11cz_z: string;

  /**
   * 轮座镶入部11 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_11cz_y: string;

  /**
   * 轮座镶入部11 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  lzxrb_11jg: string;

  /**
   * 全轴穿透1 第一次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_11_z: string;

  /**
   * 全轴穿透1 第一次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_11_y: string;

  /**
   * 全轴穿透1 第二次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_12_z: string;

  /**
   * 全轴穿透1 第二次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_12_y: string;

  /**
   * 全轴穿透1 第三次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_13_z: string;

  /**
   * 全轴穿透1 第三次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_13_y: string;

  /**
   * 全轴穿透1 第四次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_14_z: string;

  /**
   * 全轴穿透1 第四次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_14_y: string;

  /**
   * 全轴穿透1 第五次 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_15_z: string;

  /**
   * 全轴穿透1 第五次 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_15_y: string;

  /**
   * 全轴穿透1 差值 左
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_1cz_z: string;

  /**
   * 全轴穿透1 差值 右
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_1cz_y: string;

  /**
   * 全轴穿透1 结果
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  qzct_1jg: string;

  /**
   * 探伤工
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  tsg: string;

  /**
   * 工长
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  gz: string;

  /**
   * 质检员
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zjy: string;

  /**
   * 验收员
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  ysy: string;

  /**
   * 维修工
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  wxg: string;

  /**
   * 设备专职
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  sbzz: string;

  /**
   * 探伤专职
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  tszz: string;

  /**
   * 主管领导
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  zgld: string;

  /**
   * 备注
   * 数据库类型: VARCHAR2
   * 是否允许为空: 是
   */
  bz: string;
}

interface CHR503InputParams {
  sbbh: string;
  sbmc: string;
  ggxh: string;
  zzcj: string;
  dwmc: string;
  jyrq: string;
  cl11: string;
  cl12: string;
  cl13: string;
  cl14: string;
  jg1: string;
  cl21: string;
  cl22: string;
  cl23: string;
  cl24: string;
  jg2: string;
  cl31: string;
  cl32: string;
  cl33: string;
  cl34: string;
  jg3: string;
  cl41: string;
  cl42: string;
  cl43: string;
  cl44: string;
  jg4: string;
  cl51: string;
  cl52: string;
  cl53: string;
  cl54: string;
  jg5: string;
  cl61: string;
  cl62: string;
  cl63: string;
  cl64: string;
  jg6: string;
  cl71: string;
  cl72: string;
  cl73: string;
  cl74: string;
  jg7: string;
  cl81: string;
  cl82: string;
  cl83: string;
  cl84: string;
  jg8: string;
  cl91: string;
  cl92: string;
  cl93: string;
  cl94: string;
  jg9: string;
  cl101: string;
  cl102: string;
  cl103: string;
  cl104: string;
  jg10: string;
  tsg: string;
  gz: string;
  zjy: string;
  ysy: string;
  wxg: string;
  sbzz: string;
  tszz: string;
  zgld: string;
  bz: string;
}

export interface KHGetResponse {
  data: {
    mesureId: string;
    zh: string;
    zx: string;
    clbjLeft: string;
    clbjRight: string;
    czzzrq: string;
    czzzdw: string;
    ldszrq: string;
    ldszdw: string;
    ldmzrq: string;
    ldmzdw: string;
  };
  code: number;
  msg: string;
}

interface QXDataParams {
  mesureid: string;
  zh: string;
  testdatetime: string;
  testtype: string;
  btcw: string;
  tsr: string;
  tsgz: string;
  tszjy: string;
  tsysy: string;
  gzmc: string;
  clff: string;
  qxlzzdmjlnc?: string;
  qxlzzdmjlwc?: string;
  qxlzydmjlnc?: string;
  qxlzydmjlwc?: string;
  qxlzzlwcnc?: string;
  qxlzzlwcwc?: string;
  qxlzylwcnc?: string;
  qxlzylwcwc?: string;
  qxlzzlwsnc?: string;
  qxlzzlwswc?: string;
  qxlzylwsnc?: string;
  qxlzylwswc?: string;
  qxzjzdmjlzj?: string;
  qxzjzdmjlzs?: string;
  qxzjydmjlzj?: string;
  qxzjydmjlzs?: string;
  qxzjzlwczj?: string;
  qxzjzlwczs?: string;
  qxzjylwczj?: string;
  qxzjylwczs?: string;
  qxzjzlwszj?: string;
  qxzjzlwszs?: string;
  qxzjylwszj?: string;
  qxzjylwszs?: string;
  qxclzlwcz?: string;
  qxclzlwcy?: string;
  qxclylwcz?: string;
  qxclylwcy?: string;
  bz: string;
}

interface PostRequestItem {
  mesureId?: string;
  ZH: string;
  ZCTJG: string;
  ZZJJG: string;
  ZLZJG: string;
  YCTJG: string;
  YZJJG: string;
  YLZJG: string;
  JCJG: string;
  BZ?: string;
  TSRY: string;
  JCSJ: string;
  sbbh: string;
}

interface PostResponse {
  code: number;
  msg: string;
}

type VerifyWithData = Verify & {
  with: VerifyData[];
};

type QuartorWithData = Quartor & {
  with: QuartorData[];
};

const emit = createEmit("api_set");

const resolveFlawX = (flaw: VerifyData) => {
  return Math.floor(flaw.fltValueX).toString(10);
};

export interface Ipc {
  "HMIS/kh_hmis_api_get": {
    args: [string];
    return: ReturnType<typeof KH.prototype.handleFetch>;
  };
  "HMIS/kh_hmis_api_set": {
    args: [number];
    return: ReturnType<typeof KH.prototype.handleUpload>;
  };
  "HMIS/kh_hmis_sqlite_get": {
    args: [SQLiteGetParams];
    return: ReturnType<typeof KH.prototype.handleReadRecord>;
  };
  "HMIS/kh_hmis_sqlite_delete": {
    args: [number];
    return: ReturnType<typeof KH.prototype.handleDeleteRecord>;
  };
  "HMIS/kh_hmis_sqlite_insert": {
    args: [InsertRecordParams];
    return: ReturnType<typeof KH.prototype.handleInsertRecord>;
  };
}

export class KH extends HMIS<KH_HMIS> {
  private db: SQLiteDBType;
  private mdb: MDBDB;
  private net: Net;

  constructor(db: SQLiteDBType, kv: KV, mdb: MDBDB, net: Net) {
    super(kh_hmis.parse.bind(kh_hmis), KH_HMIS_STORAGE_KEY, kv);

    this.db = db;
    this.mdb = mdb;
    this.net = net;
  }

  async hydrate() {
    await super.hydrate();

    void this.autoUploadLoop();
  }

  async autoUploadLoop() {
    if (!this.getStore().autoUpload) {
      return;
    }

    const limit = pLimit(1);

    try {
      const barcodes = await this.db
        .select()
        .from(schema.khBarcodeTable)
        .where(
          sql.and(
            sql.eq(schema.khBarcodeTable.isUploaded, false),
            sql.between(
              schema.khBarcodeTable.date,
              dayjs().startOf("day").toDate(),
              dayjs().endOf("day").toDate(),
            ),
          ),
        );

      await Promise.allSettled(
        barcodes.map((barcode) => limit(() => this.handleUpload(barcode.id))),
      );
    } finally {
      const store = this.getStore();
      const delay = store.autoUploadInterval * 1000;

      setTimeout(this.autoUploadLoop.bind(this), delay);
    }
  }

  async sendQxToServer(params: QXDataParams) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/lzdx_csbtsj_whzy_tsjgqx/save`);
    const body = JSON.stringify(params);

    log(`请求数据[${url.href}]:${body}`);

    const res = await this.net.fetch(url.href, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: PostResponse = await res.json();
    log(`返回数据:${JSON.stringify(data)}`);

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }

  async recordToPostBody(record: schema.KhBarcode) {
    const id = record.id;

    if (!record) {
      throw new Error(`记录#${id}不存在`);
    }

    if (!record.zh) {
      throw new Error(`记录#${id}轴号不存在`);
    }

    if (!record.barCode) {
      throw new Error(`记录#${id}条形码不存在`);
    }

    const store = this.getStore();
    const startDate = dayjs(record.date).toISOString();
    const endDate = dayjs(record.date).endOf("day").toISOString();
    const corporation = await this.mdb.getCorporation();
    const detection = await this.mdb.getDetectionByZH({
      zh: record.zh,
      startDate,
      endDate,
    });

    const JCJG = detection.szResult === "合格" ? "1" : "0";

    const basicBody: PostRequestItem = {
      mesureId: record.barCode,
      ZH: record.zh,
      // 1 探伤 0 不探伤
      ZCTJG: "1",
      ZZJJG: "1",
      ZLZJG: "1",
      YCTJG: "1",
      YZJJG: "1",
      YLZJG: "1",
      JCJG,
      BZ: "",
      TSRY: detection.szUsername || "",
      JCSJ: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
      sbbh: corporation.DeviceNO || "",
    };

    return {
      basicBody,
      qxBody: {
        mesureid: record.barCode,
        zh: record.zh,
        testdatetime: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
        testtype: "超声波",
        btcw: "车轴",
        tsr: detection.szUsername || "",
        tsgz: store.tsgz,
        tszjy: store.tszjy,
        tsysy: store.tsysy,
        gzmc: "裂纹",
        clff: "人工复探",
        bz: "",
      } as QXDataParams,
      isQualified: JCJG === "1",
    };
  }
  async sendDataToServer(params: PostRequestItem) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/lzdx_csbtsj_tsjg/save`);
    const body = JSON.stringify(params);

    log(`请求数据[${url.href}]:${body}`);

    const res = await this.net.fetch(url.href, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: PostResponse = await res.json();
    log(`返回数据:${JSON.stringify(data)}`);

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR501ToServer(params: CHR501InputParams) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/csbts_501/save`);
    const body = JSON.stringify(params);

    log(`请求数据[${url.href}]:${body}`);

    const res = await this.net.fetch(url.href, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: PostResponse = await res.json();
    log(`返回数据:${JSON.stringify(data)}`);

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR502ToServer(params: CHR502InputParams) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/csbts_502/save`);
    const body = JSON.stringify(params);

    log(`请求数据[${url.href}]:${body}`);

    const res = await this.net.fetch(url.href, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: PostResponse = await res.json();
    log(`返回数据:${JSON.stringify(data)}`);

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async sendCHR503ToServer(params: CHR503InputParams) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/csbts_503/save`);
    const body = JSON.stringify(params);

    log(`请求数据[${url.href}]:${body}`);

    const res = await this.net.fetch(url.href, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: PostResponse = await res.json();
    log(`返回数据:${JSON.stringify(data)}`);

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }

  async handleFetch(dh: string) {
    const store = this.getStore();
    const host = store.ip + ":" + store.port;
    const url = new URL(`http://${host}/api/lzdx_csbtsj_get/get`);
    const body = JSON.stringify({ mesureId: dh });

    log(`请求数据[${url.href}]:${body}`);

    const res = await this.net.fetch(url.href, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!res.ok) {
      throw `接口异常[${res.status}]:${res.statusText}`;
    }

    const data: KHGetResponse = await res.json();
    log(`返回数据:${JSON.stringify(data)}`);

    if (data.code !== 200) {
      throw `接口异常[${data.code}]:${data.msg}`;
    }

    return data;
  }
  async handleUpload(id: number) {
    const [record] = await this.db
      .select()
      .from(schema.khBarcodeTable)
      .where(sql.eq(schema.khBarcodeTable.id, id));

    if (!record) {
      throw new Error(`记录#${id}不存在`);
    }

    const data = await this.recordToPostBody(record);
    await this.sendDataToServer(data.basicBody);

    if (!data.isQualified) {
      await this.sendQxToServer(data.qxBody);
    }

    const [result] = await this.db
      .update(schema.khBarcodeTable)
      .set({ isUploaded: true })
      .where(sql.eq(schema.khBarcodeTable.id, id))
      .returning();

    emit();

    return result;
  }
  async handleReadRecord(params: SQLiteGetParams) {
    const [{ count }] = await this.db
      .select({ count: sql.count() })
      .from(schema.khBarcodeTable)
      .where(
        sql.between(
          schema.khBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .limit(1);

    const rows = await this.db
      .select()
      .from(schema.khBarcodeTable)
      .where(
        sql.between(
          schema.khBarcodeTable.date,
          new Date(params.startDate),
          new Date(params.endDate),
        ),
      )
      .offset(params.pageIndex * params.pageSize)
      .limit(params.pageSize);

    return { rows, count };
  }
  handleDeleteRecord(id: number) {
    return this.db
      .delete(schema.khBarcodeTable)
      .where(sql.eq(schema.khBarcodeTable.id, id))
      .returning();
  }
  handleInsertRecord(params: InsertRecordParams) {
    return this.db
      .insert(schema.khBarcodeTable)
      .values({
        barCode: params.DH,
        zh: params.ZH,
        date: new Date(),
        isUploaded: false,
      })
      .returning();
  }
  async handleUploadCHR501(id: string) {
    const records = await this.mdb.getDataFromRootDB<
      Verify & {
        with: VerifyData[];
      }
    >({
      tableName: "verifies",
      with: true,
      filters: [{ type: "equal", field: "szIDs", value: id }],
    });
    const [record] = records.rows;

    if (!record) {
      throw new Error(`未找到校验记录[${id}]`);
    }

    const chr501Params = await this.verifyToCHR501InputParams(record);

    return this.sendCHR501ToServer(chr501Params);
  }
  async handleUploadCHR502(ids: string[]) {
    const records = await this.mdb.getDataForCHR502({ ids });

    if (records.rows.length < 5) {
      throw new Error(
        `CHR502接口至少需要5条记录，当前仅${records.rows.length}条`,
      );
    }

    const chr502Params = await this.quartorToCHR502InputParams(
      records.rows,
      records.previous,
    );

    return this.sendCHR502ToServer(chr502Params);
  }
  handleUploadCHR503(id: string) {}

  async verifyToCHR501InputParams(
    record: VerifyWithData,
  ): Promise<CHR501InputParams> {
    const store = this.getStore();
    const corporation = await this.mdb.getCorporation();

    const resolvedRecord = {
      ...record,
      with: resolveLzFlaws(record.with),
    };
    const data = await this.resolveFlawData(resolvedRecord);

    const leftLzData = data.filter(({ flaw }) => {
      return isLeftFlaw(flaw.nBoard) && isLZFlaw(flaw.nChannel);
    });

    const leftXHCData = data.filter(({ flaw }) => {
      return isLeftFlaw(flaw.nBoard) && isXHCFlaw(flaw.nChannel);
    });

    const leftCTData = data.filter(({ flaw }) => {
      return isLeftFlaw(flaw.nBoard) && isCTFlaw(flaw.nChannel);
    });

    const rightLzData = data.filter(({ flaw }) => {
      return isRightFlaw(flaw.nBoard) && isLZFlaw(flaw.nChannel);
    });

    const rightXHCData = data.filter(({ flaw }) => {
      return isRightFlaw(flaw.nBoard) && isXHCFlaw(flaw.nChannel);
    });

    const rightCTData = data.filter(({ flaw }) => {
      return isRightFlaw(flaw.nBoard) && isCTFlaw(flaw.nChannel);
    });

    return {
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      ggxh: corporation.DeviceType || "",
      zzcj: "武铁紫云轨道装备有限公司",
      dwmc: corporation.Factory || "",
      jyrq: dayjs(record.tmNow).format("YYYY-MM-DD"),
      swmkxh: record.szWHModel || "",
      zlz_zsj1: leftLzData[0]?.zsj || "",
      zlz_zsj2: leftLzData[1]?.zsj || "",
      zlz_zsj3: leftLzData[2]?.zsj || "",
      zlz_zsj4: leftLzData[3]?.zsj || "",
      zlz_zsj5: leftLzData[4]?.zsj || "",
      zlz_zsj6: leftLzData[5]?.zsj || "",
      zlz_zsj7: leftLzData[6]?.zsj || "",
      zlz_zsj8: leftLzData[7]?.zsj || "",
      zlz_zsj9: leftLzData[8]?.zsj || "",
      zlz_zsj10: leftLzData[9]?.zsj || "",
      zlz_zsj11: leftLzData[10]?.zsj || "",
      zlz_jy1: leftLzData[0]?.jy || "",
      zlz_jy2: leftLzData[1]?.jy || "",
      zlz_jy3: leftLzData[2]?.jy || "",
      zlz_jy4: leftLzData[3]?.jy || "",
      zlz_jy5: leftLzData[4]?.jy || "",
      zlz_jy6: leftLzData[5]?.jy || "",
      zlz_jy7: leftLzData[6]?.jy || "",
      zlz_jy8: leftLzData[7]?.jy || "",
      zlz_jy9: leftLzData[8]?.jy || "",
      zlz_jy10: leftLzData[9]?.jy || "",
      zlz_jy11: leftLzData[10]?.jy || "",
      zlz_ts1: leftLzData[0]?.ts || "",
      zlz_ts2: leftLzData[1]?.ts || "",
      zlz_ts3: leftLzData[2]?.ts || "",
      zlz_ts4: leftLzData[3]?.ts || "",
      zlz_ts5: leftLzData[4]?.ts || "",
      zlz_ts6: leftLzData[5]?.ts || "",
      zlz_ts7: leftLzData[6]?.ts || "",
      zlz_ts8: leftLzData[7]?.ts || "",
      zlz_ts9: leftLzData[8]?.ts || "",
      zlz_ts10: leftLzData[9]?.ts || "",
      zlz_ts11: leftLzData[10]?.ts || "",
      zlz_qx1_1: resolveFlawX(leftLzData[0]?.flaw) || "",
      zlz_qx1_2: "",
      zlz_qx2_1: resolveFlawX(leftLzData[1]?.flaw) || "",
      zlz_qx2_2: "",
      zlz_qx2_3: "",
      zlz_qx3_1: resolveFlawX(leftLzData[2]?.flaw) || "",
      zlz_qx3_3: "",
      zlz_qx3_4: "",
      zlz_qx4_1: resolveFlawX(leftLzData[3]?.flaw) || "",
      zlz_qx4_4: "",
      zlz_qx4_5: "",
      zlz_qx5_1: resolveFlawX(leftLzData[4]?.flaw) || "",
      zlz_qx5_5: "",
      zlz_qx5_6: "",
      zlz_qx6_1: resolveFlawX(leftLzData[5]?.flaw) || "",
      zlz_qx6_6: "",
      zlz_qx6_7: "",
      zlz_qx7_1: resolveFlawX(leftLzData[6]?.flaw) || "",
      zlz_qx7_7: "",
      zlz_qx7_8: "",
      zlz_qx8_1: resolveFlawX(leftLzData[7]?.flaw) || "",
      zlz_qx8_8: "",
      zlz_qx8_9: "",
      zlz_qx9_1: resolveFlawX(leftLzData[8]?.flaw) || "",
      zlz_qx9_9: "",
      zlz_qx9_10: "",
      zlz_qx10_1: resolveFlawX(leftLzData[9]?.flaw) || "",
      zlz_qx10_10: "",
      zlz_qx10_11: "",
      zlz_qx11_1: resolveFlawX(leftLzData[10]?.flaw) || "",
      zlz_qx11_11: "",
      ylz_zsj1: rightLzData[0]?.zsj || "",
      ylz_zsj2: rightLzData[1]?.zsj || "",
      ylz_zsj3: rightLzData[2]?.zsj || "",
      ylz_zsj4: rightLzData[3]?.zsj || "",
      ylz_zsj5: rightLzData[4]?.zsj || "",
      ylz_zsj6: rightLzData[5]?.zsj || "",
      ylz_zsj7: rightLzData[6]?.zsj || "",
      ylz_zsj8: rightLzData[7]?.zsj || "",
      ylz_zsj9: rightLzData[8]?.zsj || "",
      ylz_zsj10: rightLzData[9]?.zsj || "",
      ylz_zsj11: rightLzData[10]?.zsj || "",
      ylz_jy1: rightLzData[0]?.jy || "",
      ylz_jy2: rightLzData[1]?.jy || "",
      ylz_jy3: rightLzData[2]?.jy || "",
      ylz_jy4: rightLzData[3]?.jy || "",
      ylz_jy5: rightLzData[4]?.jy || "",
      ylz_jy6: rightLzData[5]?.jy || "",
      ylz_jy7: rightLzData[6]?.jy || "",
      ylz_jy8: rightLzData[7]?.jy || "",
      ylz_jy9: rightLzData[8]?.jy || "",
      ylz_jy10: rightLzData[9]?.jy || "",
      ylz_jy11: rightLzData[10]?.jy || "",
      ylz_ts1: rightLzData[0]?.ts || "",
      ylz_ts2: rightLzData[1]?.ts || "",
      ylz_ts3: rightLzData[2]?.ts || "",
      ylz_ts4: rightLzData[3]?.ts || "",
      ylz_ts5: rightLzData[4]?.ts || "",
      ylz_ts6: rightLzData[5]?.ts || "",
      ylz_ts7: rightLzData[6]?.ts || "",
      ylz_ts8: rightLzData[7]?.ts || "",
      ylz_ts9: rightLzData[8]?.ts || "",
      ylz_ts10: rightLzData[9]?.ts || "",
      ylz_ts11: rightLzData[10]?.ts || "",
      ylz_qx1_1: resolveFlawX(rightLzData[0]?.flaw) || "",
      ylz_qx1_2: "",
      ylz_qx2_1: resolveFlawX(rightLzData[1]?.flaw) || "",
      ylz_qx2_2: "",
      ylz_qx2_3: "",
      ylz_qx3_1: resolveFlawX(rightLzData[2]?.flaw) || "",
      ylz_qx3_3: "",
      ylz_qx3_4: "",
      ylz_qx4_1: resolveFlawX(rightLzData[3]?.flaw) || "",
      ylz_qx4_4: "",
      ylz_qx4_5: "",
      ylz_qx5_1: resolveFlawX(rightLzData[4]?.flaw) || "",
      ylz_qx5_5: "",
      ylz_qx5_6: "",
      ylz_qx6_1: resolveFlawX(rightLzData[5]?.flaw) || "",
      ylz_qx6_6: "",
      ylz_qx6_7: "",
      ylz_qx7_1: resolveFlawX(rightLzData[6]?.flaw) || "",
      ylz_qx7_7: "",
      ylz_qx7_8: "",
      ylz_qx8_1: resolveFlawX(rightLzData[7]?.flaw) || "",
      ylz_qx8_8: "",
      ylz_qx8_9: "",
      ylz_qx9_1: resolveFlawX(rightLzData[8]?.flaw) || "",
      ylz_qx9_9: "",
      ylz_qx9_10: "",
      ylz_qx10_1: resolveFlawX(rightLzData[9]?.flaw) || "",
      ylz_qx10_10: "",
      ylz_qx10_11: "",
      ylz_qx11_1: resolveFlawX(rightLzData[10]?.flaw) || "",
      ylz_qx11_11: "",
      zzj_zsj: leftXHCData[0].zsj,
      zzj_jy: leftXHCData[0].jy,
      zzj_ts: leftXHCData[0].ts,
      zzj_qx1: leftXHCData[0].flaw.fltValueX.toString(),
      zzj_qx2: leftXHCData[1].flaw.fltValueX.toString(),
      zzj_qx3: leftXHCData[2].flaw.fltValueX.toString(),
      zct_zsj: leftCTData[0].zsj,
      zct_jy: leftCTData[0].jy,
      zct_ts: leftCTData[0].ts,
      zct_qx: leftCTData[0].flaw.fltValueX.toString(),
      yzj_zsj: rightXHCData[0].zsj,
      yzj_jy: rightXHCData[0].jy,
      yzj_ts: rightXHCData[0].ts,
      yzj_qx1: rightXHCData[0].flaw.fltValueX.toString(),
      yzj_qx2: rightXHCData[1].flaw.fltValueX.toString(),
      yzj_qx3: rightXHCData[2].flaw.fltValueX.toString(),
      yct_zsj: rightCTData[0].zsj,
      yct_jy: rightCTData[0].jy,
      yct_ts: rightCTData[0].ts,
      yct_qx: rightCTData[0].flaw.fltValueX.toString(),
      czz: record.szUsername || "",
      gz: store.tsgz,
      wxg: store.tswxg,
      zjy: store.tszjy,
      ysy: store.tsysy,
      bz: "",
    };
  }
  async quartorToCHR502InputParams(
    records: QuartorWithData[],
    previous: Quartor | null,
  ): Promise<CHR502InputParams> {
    const store = this.getStore();
    const corporation = await this.mdb.getCorporation();
    const tsg = records[0].szUsername || "";

    const firstData = this.resolveCHR502Data(records[0]);
    const secondData = this.resolveCHR502Data(records[1]);
    const thirdData = this.resolveCHR502Data(records[2]);
    const fourthData = this.resolveCHR502Data(records[3]);
    const fifthData = this.resolveCHR502Data(records[4]);

    return {
      xrsj: dayjs(records[0].tmnow).format("YYYY-MM-DD HH:mm:ss"),
      sbbh: corporation.DeviceNO || "",
      sbmc: corporation.DeviceName || "",
      dwmc: corporation.Factory || "",
      zzsj: corporation.prodate || "",
      zzdw: "武铁紫云轨道装备有限公司",
      scjxsj: previous ? dayjs(previous.tmnow).format("YYYY-MM-DD") : "",
      jyrq: dayjs(records[0].tmnow).format("YYYY-MM-DD"),
      zjgb_11_z: calculateNAtten(firstData.leftXHC[0]) || "",
      zjgb_11_y: calculateNAtten(firstData.rightXHC[0]) || "",
      zjgb_12_z: calculateNAtten(secondData.leftXHC[0]) || "",
      zjgb_12_y: calculateNAtten(secondData.rightXHC[0]) || "",
      zjgb_13_z: calculateNAtten(thirdData.leftXHC[0]) || "",
      zjgb_13_y: calculateNAtten(thirdData.rightXHC[0]) || "",
      zjgb_14_z: calculateNAtten(fourthData.leftXHC[0]) || "",
      zjgb_14_y: calculateNAtten(fourthData.rightXHC[0]) || "",
      zjgb_15_z: calculateNAtten(fifthData.leftXHC[0]) || "",
      zjgb_15_y: calculateNAtten(fifthData.rightXHC[0]) || "",
      zjgb_1cz_z: calculateNAttenDiff(
        firstData.leftXHC[0],
        secondData.leftXHC[0],
        thirdData.leftXHC[0],
        fourthData.leftXHC[0],
        fifthData.leftXHC[0],
      ),
      zjgb_1cz_y: calculateNAttenDiff(
        firstData.rightXHC[0],
        secondData.rightXHC[0],
        thirdData.rightXHC[0],
        fourthData.rightXHC[0],
        fifthData.rightXHC[0],
      ),
      zjgb_1jg: resolveQuartorResult(
        firstData.rightXHC[0],
        secondData.rightXHC[0],
        thirdData.rightXHC[0],
        fourthData.rightXHC[0],
        fifthData.rightXHC[0],
      ),
      zjgb_21_z: calculateNAtten(firstData.leftXHC[1]) || "",
      zjgb_21_y: calculateNAtten(firstData.rightXHC[1]) || "",
      zjgb_22_z: calculateNAtten(secondData.leftXHC[1]) || "",
      zjgb_22_y: calculateNAtten(secondData.rightXHC[1]) || "",
      zjgb_23_z: calculateNAtten(thirdData.leftXHC[1]) || "",
      zjgb_23_y: calculateNAtten(thirdData.rightXHC[1]) || "",
      zjgb_24_z: calculateNAtten(fourthData.leftXHC[1]) || "",
      zjgb_24_y: calculateNAtten(fourthData.rightXHC[1]) || "",
      zjgb_25_z: calculateNAtten(fifthData.leftXHC[1]) || "",
      zjgb_25_y: calculateNAtten(fifthData.rightXHC[1]) || "",
      zjgb_2cz_z: calculateNAttenDiff(
        firstData.leftXHC[1],
        secondData.leftXHC[1],
        thirdData.leftXHC[1],
        fourthData.leftXHC[1],
        fifthData.leftXHC[1],
      ),
      zjgb_2cz_y: calculateNAttenDiff(
        firstData.rightXHC[1],
        secondData.rightXHC[1],
        thirdData.rightXHC[1],
        fourthData.rightXHC[1],
        fifthData.rightXHC[1],
      ),
      zjgb_2jg: resolveQuartorResult(
        firstData.rightXHC[1],
        secondData.rightXHC[1],
        thirdData.rightXHC[1],
        fourthData.rightXHC[1],
        fifthData.rightXHC[1],
      ),
      zjgb_31_z: calculateNAtten(firstData.leftXHC[2]) || "",
      zjgb_31_y: calculateNAtten(firstData.rightXHC[2]) || "",
      zjgb_32_z: calculateNAtten(secondData.leftXHC[2]) || "",
      zjgb_32_y: calculateNAtten(secondData.rightXHC[2]) || "",
      zjgb_33_z: calculateNAtten(thirdData.leftXHC[2]) || "",
      zjgb_33_y: calculateNAtten(thirdData.rightXHC[2]) || "",
      zjgb_34_z: calculateNAtten(fourthData.leftXHC[2]) || "",
      zjgb_34_y: calculateNAtten(fourthData.rightXHC[2]) || "",
      zjgb_35_z: calculateNAtten(fifthData.leftXHC[2]) || "",
      zjgb_35_y: calculateNAtten(fifthData.rightXHC[2]) || "",
      zjgb_3cz_z: calculateNAttenDiff(
        firstData.leftXHC[2],
        secondData.leftXHC[2],
        thirdData.leftXHC[2],
        fourthData.leftXHC[2],
        fifthData.leftXHC[2],
      ),
      zjgb_3cz_y: calculateNAttenDiff(
        firstData.rightXHC[2],
        secondData.rightXHC[2],
        thirdData.rightXHC[2],
        fourthData.rightXHC[2],
        fifthData.rightXHC[2],
      ),
      zjgb_3jg: resolveQuartorResult(
        firstData.rightXHC[2],
        secondData.rightXHC[2],
        thirdData.rightXHC[2],
        fourthData.rightXHC[2],
        fifthData.rightXHC[2],
      ),
      lzxrb_11_z: calculateNAtten(firstData.leftLZ[0]) || "",
      lzxrb_11_y: calculateNAtten(firstData.rightLZ[0]) || "",
      lzxrb_12_z: calculateNAtten(secondData.leftLZ[0]) || "",
      lzxrb_12_y: calculateNAtten(secondData.rightLZ[0]) || "",
      lzxrb_13_z: calculateNAtten(thirdData.leftLZ[0]) || "",
      lzxrb_13_y: calculateNAtten(thirdData.rightLZ[0]) || "",
      lzxrb_14_z: calculateNAtten(fourthData.leftLZ[0]) || "",
      lzxrb_14_y: calculateNAtten(fourthData.rightLZ[0]) || "",
      lzxrb_15_z: calculateNAtten(fifthData.leftLZ[0]) || "",
      lzxrb_15_y: calculateNAtten(fifthData.rightLZ[0]) || "",
      lzxrb_1cz_z: calculateNAttenDiff(
        firstData.leftLZ[0],
        secondData.leftLZ[0],
        thirdData.leftLZ[0],
        fourthData.leftLZ[0],
        fifthData.leftLZ[0],
      ),
      lzxrb_1cz_y: calculateNAttenDiff(
        firstData.rightLZ[0],
        secondData.rightLZ[0],
        thirdData.rightLZ[0],
        fourthData.rightLZ[0],
        fifthData.rightLZ[0],
      ),
      lzxrb_1jg: resolveQuartorResult(
        firstData.rightLZ[0],
        secondData.rightLZ[0],
        thirdData.rightLZ[0],
        fourthData.rightLZ[0],
        fifthData.rightLZ[0],
      ),
      lzxrb_21_z: calculateNAtten(firstData.leftLZ[1]) || "",
      lzxrb_21_y: calculateNAtten(firstData.rightLZ[1]) || "",
      lzxrb_22_z: calculateNAtten(secondData.leftLZ[1]) || "",
      lzxrb_22_y: calculateNAtten(secondData.rightLZ[1]) || "",
      lzxrb_23_z: calculateNAtten(thirdData.leftLZ[1]) || "",
      lzxrb_23_y: calculateNAtten(thirdData.rightLZ[1]) || "",
      lzxrb_24_z: calculateNAtten(fourthData.leftLZ[1]) || "",
      lzxrb_24_y: calculateNAtten(fourthData.rightLZ[1]) || "",
      lzxrb_25_z: calculateNAtten(fifthData.leftLZ[1]) || "",
      lzxrb_25_y: calculateNAtten(fifthData.rightLZ[1]) || "",
      lzxrb_2cz_z: calculateNAttenDiff(
        firstData.leftLZ[1],
        secondData.leftLZ[1],
        thirdData.leftLZ[1],
        fourthData.leftLZ[1],
        fifthData.leftLZ[1],
      ),
      lzxrb_2cz_y: calculateNAttenDiff(
        firstData.rightLZ[1],
        secondData.rightLZ[1],
        thirdData.rightLZ[1],
        fourthData.rightLZ[1],
        fifthData.rightLZ[1],
      ),
      lzxrb_2jg: resolveQuartorResult(
        firstData.rightLZ[1],
        secondData.rightLZ[1],
        thirdData.rightLZ[1],
        fourthData.rightLZ[1],
        fifthData.rightLZ[1],
      ),
      lzxrb_31_z: calculateNAtten(firstData.leftLZ[2]) || "",
      lzxrb_31_y: calculateNAtten(firstData.rightLZ[2]) || "",
      lzxrb_32_z: calculateNAtten(secondData.leftLZ[2]) || "",
      lzxrb_32_y: calculateNAtten(secondData.rightLZ[2]) || "",
      lzxrb_33_z: calculateNAtten(thirdData.leftLZ[2]) || "",
      lzxrb_33_y: calculateNAtten(thirdData.rightLZ[2]) || "",
      lzxrb_34_z: calculateNAtten(fourthData.leftLZ[2]) || "",
      lzxrb_34_y: calculateNAtten(fourthData.rightLZ[2]) || "",
      lzxrb_35_z: calculateNAtten(fifthData.leftLZ[2]) || "",
      lzxrb_35_y: calculateNAtten(fifthData.rightLZ[2]) || "",
      lzxrb_3cz_z: calculateNAttenDiff(
        firstData.leftLZ[2],
        secondData.leftLZ[2],
        thirdData.leftLZ[2],
        fourthData.leftLZ[2],
        fifthData.leftLZ[2],
      ),
      lzxrb_3cz_y: calculateNAttenDiff(
        firstData.rightLZ[2],
        secondData.rightLZ[2],
        thirdData.rightLZ[2],
        fourthData.rightLZ[2],
        fifthData.rightLZ[2],
      ),
      lzxrb_3jg: resolveQuartorResult(
        firstData.rightLZ[2],
        secondData.rightLZ[2],
        thirdData.rightLZ[2],
        fourthData.rightLZ[2],
        fifthData.rightLZ[2],
      ),
      lzxrb_41_z: calculateNAtten(firstData.leftLZ[3]) || "",
      lzxrb_41_y: calculateNAtten(firstData.rightLZ[3]) || "",
      lzxrb_42_z: calculateNAtten(secondData.leftLZ[3]) || "",
      lzxrb_42_y: calculateNAtten(secondData.rightLZ[3]) || "",
      lzxrb_43_z: calculateNAtten(thirdData.leftLZ[3]) || "",
      lzxrb_43_y: calculateNAtten(thirdData.rightLZ[3]) || "",
      lzxrb_44_z: calculateNAtten(fourthData.leftLZ[3]) || "",
      lzxrb_44_y: calculateNAtten(fourthData.rightLZ[3]) || "",
      lzxrb_45_z: calculateNAtten(fifthData.leftLZ[3]) || "",
      lzxrb_45_y: calculateNAtten(fifthData.rightLZ[3]) || "",
      lzxrb_4cz_z: calculateNAttenDiff(
        firstData.leftLZ[3],
        secondData.leftLZ[3],
        thirdData.leftLZ[3],
        fourthData.leftLZ[3],
        fifthData.leftLZ[3],
      ),
      lzxrb_4cz_y: calculateNAttenDiff(
        firstData.rightLZ[3],
        secondData.rightLZ[3],
        thirdData.rightLZ[3],
        fourthData.rightLZ[3],
        fifthData.rightLZ[3],
      ),
      lzxrb_4jg: resolveQuartorResult(
        firstData.rightLZ[3],
        secondData.rightLZ[3],
        thirdData.rightLZ[3],
        fourthData.rightLZ[3],
        fifthData.rightLZ[3],
      ),
      lzxrb_51_z: calculateNAtten(firstData.leftLZ[4]) || "",
      lzxrb_51_y: calculateNAtten(firstData.rightLZ[4]) || "",
      lzxrb_52_z: calculateNAtten(secondData.leftLZ[4]) || "",
      lzxrb_52_y: calculateNAtten(secondData.rightLZ[4]) || "",
      lzxrb_53_z: calculateNAtten(thirdData.leftLZ[4]) || "",
      lzxrb_53_y: calculateNAtten(thirdData.rightLZ[4]) || "",
      lzxrb_54_z: calculateNAtten(fourthData.leftLZ[4]) || "",
      lzxrb_54_y: calculateNAtten(fourthData.rightLZ[4]) || "",
      lzxrb_55_z: calculateNAtten(fifthData.leftLZ[4]) || "",
      lzxrb_55_y: calculateNAtten(fifthData.rightLZ[4]) || "",
      lzxrb_5cz_z: calculateNAttenDiff(
        firstData.leftLZ[4],
        secondData.leftLZ[4],
        thirdData.leftLZ[4],
        fourthData.leftLZ[4],
        fifthData.leftLZ[4],
      ),
      lzxrb_5cz_y: calculateNAttenDiff(
        firstData.rightLZ[4],
        secondData.rightLZ[4],
        thirdData.rightLZ[4],
        fourthData.rightLZ[4],
        fifthData.rightLZ[4],
      ),
      lzxrb_5jg: resolveQuartorResult(
        firstData.rightLZ[4],
        secondData.rightLZ[4],
        thirdData.rightLZ[4],
        fourthData.rightLZ[4],
        fifthData.rightLZ[4],
      ),
      lzxrb_61_z: calculateNAtten(firstData.leftLZ[5]) || "",
      lzxrb_61_y: calculateNAtten(firstData.rightLZ[5]) || "",
      lzxrb_62_z: calculateNAtten(secondData.leftLZ[5]) || "",
      lzxrb_62_y: calculateNAtten(secondData.rightLZ[5]) || "",
      lzxrb_63_z: calculateNAtten(thirdData.leftLZ[5]) || "",
      lzxrb_63_y: calculateNAtten(thirdData.rightLZ[5]) || "",
      lzxrb_64_z: calculateNAtten(fourthData.leftLZ[5]) || "",
      lzxrb_64_y: calculateNAtten(fourthData.rightLZ[5]) || "",
      lzxrb_65_z: calculateNAtten(fifthData.leftLZ[5]) || "",
      lzxrb_65_y: calculateNAtten(fifthData.rightLZ[5]) || "",
      lzxrb_6cz_z: calculateNAttenDiff(
        firstData.leftLZ[5],
        secondData.leftLZ[5],
        thirdData.leftLZ[5],
        fourthData.leftLZ[5],
        fifthData.leftLZ[5],
      ),
      lzxrb_6cz_y: calculateNAttenDiff(
        firstData.rightLZ[5],
        secondData.rightLZ[5],
        thirdData.rightLZ[5],
        fourthData.rightLZ[5],
        fifthData.rightLZ[5],
      ),
      lzxrb_6jg: resolveQuartorResult(
        firstData.rightLZ[5],
        secondData.rightLZ[5],
        thirdData.rightLZ[5],
        fourthData.rightLZ[5],
        fifthData.rightLZ[5],
      ),
      lzxrb_71_z: calculateNAtten(firstData.leftLZ[6]) || "",
      lzxrb_71_y: calculateNAtten(firstData.rightLZ[6]) || "",
      lzxrb_72_z: calculateNAtten(secondData.leftLZ[6]) || "",
      lzxrb_72_y: calculateNAtten(secondData.rightLZ[6]) || "",
      lzxrb_73_z: calculateNAtten(thirdData.leftLZ[6]) || "",
      lzxrb_73_y: calculateNAtten(thirdData.rightLZ[6]) || "",
      lzxrb_74_z: calculateNAtten(fourthData.leftLZ[6]) || "",
      lzxrb_74_y: calculateNAtten(fourthData.rightLZ[6]) || "",
      lzxrb_75_z: calculateNAtten(fifthData.leftLZ[6]) || "",
      lzxrb_75_y: calculateNAtten(fifthData.rightLZ[6]) || "",
      lzxrb_7cz_z: calculateNAttenDiff(
        firstData.leftLZ[6],
        secondData.leftLZ[6],
        thirdData.leftLZ[6],
        fourthData.leftLZ[6],
        fifthData.leftLZ[6],
      ),
      lzxrb_7cz_y: calculateNAttenDiff(
        firstData.rightLZ[6],
        secondData.rightLZ[6],
        thirdData.rightLZ[6],
        fourthData.rightLZ[6],
        fifthData.rightLZ[6],
      ),
      lzxrb_7jg: resolveQuartorResult(
        firstData.rightLZ[6],
        secondData.rightLZ[6],
        thirdData.rightLZ[6],
        fourthData.rightLZ[6],
        fifthData.rightLZ[6],
      ),
      lzxrb_81_z: calculateNAtten(firstData.leftLZ[7]) || "",
      lzxrb_81_y: calculateNAtten(firstData.rightLZ[7]) || "",
      lzxrb_82_z: calculateNAtten(secondData.leftLZ[7]) || "",
      lzxrb_82_y: calculateNAtten(secondData.rightLZ[7]) || "",
      lzxrb_83_z: calculateNAtten(thirdData.leftLZ[7]) || "",
      lzxrb_83_y: calculateNAtten(thirdData.rightLZ[7]) || "",
      lzxrb_84_z: calculateNAtten(fourthData.leftLZ[7]) || "",
      lzxrb_84_y: calculateNAtten(fourthData.rightLZ[7]) || "",
      lzxrb_85_z: calculateNAtten(fifthData.leftLZ[7]) || "",
      lzxrb_85_y: calculateNAtten(fifthData.rightLZ[7]) || "",
      lzxrb_8cz_z: calculateNAttenDiff(
        firstData.leftLZ[7],
        secondData.leftLZ[7],
        thirdData.leftLZ[7],
        fourthData.leftLZ[7],
        fifthData.leftLZ[7],
      ),
      lzxrb_8cz_y: calculateNAttenDiff(
        firstData.rightLZ[7],
        secondData.rightLZ[7],
        thirdData.rightLZ[7],
        fourthData.rightLZ[7],
        fifthData.rightLZ[7],
      ),
      lzxrb_8jg: resolveQuartorResult(
        firstData.rightLZ[7],
        secondData.rightLZ[7],
        thirdData.rightLZ[7],
        fourthData.rightLZ[7],
        fifthData.rightLZ[7],
      ),
      lzxrb_91_z: calculateNAtten(firstData.leftLZ[8]) || "",
      lzxrb_91_y: calculateNAtten(firstData.rightLZ[8]) || "",
      lzxrb_92_z: calculateNAtten(secondData.leftLZ[8]) || "",
      lzxrb_92_y: calculateNAtten(secondData.rightLZ[8]) || "",
      lzxrb_93_z: calculateNAtten(thirdData.leftLZ[8]) || "",
      lzxrb_93_y: calculateNAtten(thirdData.rightLZ[8]) || "",
      lzxrb_94_z: calculateNAtten(fourthData.leftLZ[8]) || "",
      lzxrb_94_y: calculateNAtten(fourthData.rightLZ[8]) || "",
      lzxrb_95_z: calculateNAtten(fifthData.leftLZ[8]) || "",
      lzxrb_95_y: calculateNAtten(fifthData.rightLZ[8]) || "",
      lzxrb_9cz_z: calculateNAttenDiff(
        firstData.leftLZ[8],
        secondData.leftLZ[8],
        thirdData.leftLZ[8],
        fourthData.leftLZ[8],
        fifthData.leftLZ[8],
      ),
      lzxrb_9cz_y: calculateNAttenDiff(
        firstData.rightLZ[8],
        secondData.rightLZ[8],
        thirdData.rightLZ[8],
        fourthData.rightLZ[8],
        fifthData.rightLZ[8],
      ),
      lzxrb_9jg: resolveQuartorResult(
        firstData.rightLZ[8],
        secondData.rightLZ[8],
        thirdData.rightLZ[8],
        fourthData.rightLZ[8],
        fifthData.rightLZ[8],
      ),
      lzxrb_101_z: calculateNAtten(firstData.leftLZ[9]) || "",
      lzxrb_101_y: calculateNAtten(firstData.rightLZ[9]) || "",
      lzxrb_102_z: calculateNAtten(secondData.leftLZ[9]) || "",
      lzxrb_102_y: calculateNAtten(secondData.rightLZ[9]) || "",
      lzxrb_103_z: calculateNAtten(thirdData.leftLZ[9]) || "",
      lzxrb_103_y: calculateNAtten(thirdData.rightLZ[9]) || "",
      lzxrb_104_z: calculateNAtten(fourthData.leftLZ[9]) || "",
      lzxrb_104_y: calculateNAtten(fourthData.rightLZ[9]) || "",
      lzxrb_105_z: calculateNAtten(fifthData.leftLZ[9]) || "",
      lzxrb_105_y: calculateNAtten(fifthData.rightLZ[9]) || "",
      lzxrb_10cz_z: calculateNAttenDiff(
        firstData.leftLZ[9],
        secondData.leftLZ[9],
        thirdData.leftLZ[9],
        fourthData.leftLZ[9],
        fifthData.leftLZ[9],
      ),
      lzxrb_10cz_y: calculateNAttenDiff(
        firstData.rightLZ[9],
        secondData.rightLZ[9],
        thirdData.rightLZ[9],
        fourthData.rightLZ[9],
        fifthData.rightLZ[9],
      ),
      lzxrb_10jg: resolveQuartorResult(
        firstData.rightLZ[9],
        secondData.rightLZ[9],
        thirdData.rightLZ[9],
        fourthData.rightLZ[9],
        fifthData.rightLZ[9],
      ),
      lzxrb_111_z: calculateNAtten(firstData.leftLZ[10]) || "",
      lzxrb_111_y: calculateNAtten(firstData.rightLZ[10]) || "",
      lzxrb_112_z: calculateNAtten(secondData.leftLZ[10]) || "",
      lzxrb_112_y: calculateNAtten(secondData.rightLZ[10]) || "",
      lzxrb_113_z: calculateNAtten(thirdData.leftLZ[10]) || "",
      lzxrb_113_y: calculateNAtten(thirdData.rightLZ[10]) || "",
      lzxrb_114_z: calculateNAtten(fourthData.leftLZ[10]) || "",
      lzxrb_114_y: calculateNAtten(fourthData.rightLZ[10]) || "",
      lzxrb_115_z: calculateNAtten(fifthData.leftLZ[10]) || "",
      lzxrb_115_y: calculateNAtten(fifthData.rightLZ[10]) || "",
      lzxrb_11cz_z: calculateNAttenDiff(
        firstData.leftLZ[10],
        secondData.leftLZ[10],
        thirdData.leftLZ[10],
        fourthData.leftLZ[10],
        fifthData.leftLZ[10],
      ),
      lzxrb_11cz_y: calculateNAttenDiff(
        firstData.rightLZ[10],
        secondData.rightLZ[10],
        thirdData.rightLZ[10],
        fourthData.rightLZ[10],
        fifthData.rightLZ[10],
      ),
      lzxrb_11jg: resolveQuartorResult(
        firstData.rightLZ[10],
        secondData.rightLZ[10],
        thirdData.rightLZ[10],
        fourthData.rightLZ[10],
        fifthData.rightLZ[10],
      ),
      qzct_11_z: calculateNAtten(firstData.leftCT[0]) || "",
      qzct_11_y: calculateNAtten(firstData.rightCT[0]) || "",
      qzct_12_z: calculateNAtten(secondData.leftCT[0]) || "",
      qzct_12_y: calculateNAtten(secondData.rightCT[0]) || "",
      qzct_13_z: calculateNAtten(thirdData.leftCT[0]) || "",
      qzct_13_y: calculateNAtten(thirdData.rightCT[0]) || "",
      qzct_14_z: calculateNAtten(fourthData.leftCT[0]) || "",
      qzct_14_y: calculateNAtten(fourthData.rightCT[0]) || "",
      qzct_15_z: calculateNAtten(fifthData.leftCT[0]) || "",
      qzct_15_y: calculateNAtten(fifthData.rightCT[0]) || "",
      qzct_1cz_z: calculateNAttenDiff(
        firstData.leftCT[0],
        secondData.leftCT[0],
        thirdData.leftCT[0],
        fourthData.leftCT[0],
        fifthData.leftCT[0],
      ),
      qzct_1cz_y: calculateNAttenDiff(
        firstData.rightCT[0],
        secondData.rightCT[0],
        thirdData.rightCT[0],
        fourthData.rightCT[0],
        fifthData.rightCT[0],
      ),
      qzct_1jg: resolveQuartorResult(
        firstData.rightCT[0],
        secondData.rightCT[0],
        thirdData.rightCT[0],
        fourthData.rightCT[0],
        fifthData.rightCT[0],
      ),
      tsg,
      gz: store.tsgz,
      zjy: store.tszjy,
      ysy: store.tsysy,
      wxg: store.tswxg,
      sbzz: "",
      tszz: "",
      zgld: "",
      bz: "",
    };
  }
  async toCHR503InputParams(): Promise<CHR503InputParams> {
    return {};
  }

  resolveFlawData(record: VerifyWithData) {
    return Promise.all(
      record.with.map(async (flaw) => {
        const detector = await this.mdb.getDetector(
          flaw.nChannel,
          flaw.nBoard,
          record.szWHModel || "",
        );

        return {
          flaw,
          detector,
          zsj: calculateZSJ(detector.nWAngle),
          jy: calculateJY(flaw.nAtten),
          ts: calculateTS(flaw.nAtten, detector.nDBSub),
        };
      }),
    );
  }
  groupFlaws(flaws: QuartorData[]) {
    return mapGroupBy(flaws, (flaw) => {
      const isLeftCT = isLeftFlaw(flaw.nBoard) && isCTFlaw(flaw.nChannel);
      if (isLeftCT) return "leftCT";

      const isRightCT = isRightFlaw(flaw.nBoard) && isCTFlaw(flaw.nChannel);
      if (isRightCT) return "rightCT";

      const isLeftXHC = isLeftFlaw(flaw.nBoard) && isXHCFlaw(flaw.nChannel);
      if (isLeftXHC) return "leftXHC";

      const isRightXHC = isRightFlaw(flaw.nBoard) && isXHCFlaw(flaw.nChannel);
      if (isRightXHC) return "rightXHC";

      const isLeftLZ = isLeftFlaw(flaw.nBoard) && isLZFlaw(flaw.nChannel);
      if (isLeftLZ) return "leftLZ";

      const isRightLZ = isRightFlaw(flaw.nBoard) && isLZFlaw(flaw.nChannel);
      if (isRightLZ) return "rightLZ";
    });
  }
  resolveCHR502Data(record: QuartorWithData) {
    const flawGroup = this.groupFlaws(record.with);

    return {
      /**
       * 左穿透，一个伤
       */
      leftCT: flawGroup.get("leftCT") || [],
      /**
       * 右穿透，一个伤
       */
      rightCT: flawGroup.get("rightCT") || [],
      /**
       * 左卸荷槽，三伤
       */
      leftXHC: flawGroup.get("leftXHC") || [],
      /**
       * 右卸荷槽，三伤
       */
      rightXHC: flawGroup.get("rightXHC") || [],
      /**
       * 左轮座，十一伤
       */
      leftLZ: flawGroup.get("leftLZ") || [],
      /**
       * 右轮座，十一伤
       */
      rightLZ: flawGroup.get("rightLZ") || [],
    };
  }
}

export const bindIpcHandlers = (hmis: KH, ipcHandle: IpcHandle) => {
  ipcHandle("HMIS/kh_hmis_sqlite_get", (_, params) => {
    return hmis.handleReadRecord(params);
  });
  ipcHandle("HMIS/kh_hmis_sqlite_delete", (_, id) => {
    return hmis.handleDeleteRecord(id);
  });
  ipcHandle("HMIS/kh_hmis_sqlite_insert", (_, params) => {
    return hmis.handleInsertRecord(params);
  });
  ipcHandle("HMIS/kh_hmis_api_get", (_, barcode) => hmis.handleFetch(barcode));
  ipcHandle("HMIS/kh_hmis_api_set", (_, id) => hmis.handleUpload(id));
};
