// 成都北 华兴致远

import { net } from "electron";
import { getDataFromAccessDatabase, log } from "./lib";
import dayjs from "dayjs";
import { URL } from "node:url";
import type {
  Detection,
  DetectionData,
  DatabaseBaseParams,
} from "@/api/database_types";

export type GetResponse = [
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
  }
];

export type GetRequest = {
  barCode: string;
  host: string;
};

export const getFn = async (request: GetRequest) => {
  const url = new URL(`http://${request.host}/pmss/vjkxx.do`);
  url.searchParams.set("method", "getData");
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", request.barCode);
  log(`请求数据:${url.href}`);
  const res = await net.fetch(url.href, { method: "GET" });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data: GetResponse = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  return data;
};

export type PostRequestItem = {
  PJ_JXID: string; // 设备生产ID(主键)
  SB_SN: string; // 设备编号
  PJ_TAG: string; // 设备工作状态(开始检修1/结束检修0检修前后更新此标志)
  PJ_ZH: string; // 轴号
  PJ_XH: string; // 轴型
  PJ_ZZRQ: string; // 制造日期
  PJ_ZZDW: string; // 制造单位
  PJ_SN: string; // 从HMIS获取的唯一ID(记录流水号)
  PJ_JXRQ: string; // 检修日期(最近更新PJ_TAG的时间)
  CZCTZ: string; // 车轴穿透左(人员签名)
  CZCTY: string; // 车轴穿透右(人员签名)
  LZXRBZ: string; // 轮座镶入部左(人员签名)
  LZXRBY: string; // 轮座镶入部右(人员签名)
  XHCZ: string; // 卸荷槽左(人员签名)
  XHCY: string; // 卸荷槽右(人员签名)
  LW_TFLAW_PLACE: string; // 缺陷部位
  LW_TFLAW_TYPE: string; // 缺陷类型
  LW_TVIEW: string; // 处理意见
  PJ_SCZZRQ: string; // 首次组装日期
  PJ_SCZZDW: string; // 首次组装单位
  PJ_MCZZRQ: string; // 末次组装日期
  PJ_MCZZDW: string; // 末次组装单位
  LW_CZCTZ: string; // 左穿透
  LW_CZCTY: string; // 右穿透
  LW_LZXRBZ: string; // 左轮座
  LW_LZXRBY: string; // 右轮座
  LW_XHCZ: string; // 左轴颈
  LW_XHCY: string; // 右轴颈
};

export type PostRequest = {
  data: PostRequestItem;
  host: string;
};

export type PostResponse = boolean;

export const postFn = async (request: PostRequest) => {
  const url = new URL(`http://${request.host}/pmss/example.do`);
  url.searchParams.set("method", "saveData");
  url.searchParams.set("type", "csbts");
  const body = JSON.stringify(request.data);
  log(`请求数据:${url.href},${body}`);
  const res = await net.fetch(url.href, {
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
  if (!data) {
    throw `接口异常${data}`;
  }
  return data;
};

type Record = {
  dh: string;
  zh: string;
  PJ_ZZRQ: string; // 制造日期
  PJ_ZZDW: string; // 制造单位
  PJ_SCZZRQ: string; // 首次组装日期
  PJ_SCZZDW: string; // 首次组装单位
  PJ_MCZZRQ: string; // 末次组装日期
  PJ_MCZZDW: string; // 末次组装单位
};

export type SaveDataParams = DatabaseBaseParams & {
  host: string;
  records: Record[];
};

const formatDate = (date: string | null) =>
  dayjs(date).format("YYYY-MM-DD HH:mm:ss");

export const recordToSaveDataParams = async (
  record: Record,
  SB_SN: string,
  startDate: string,
  endDate: string,
  driverPath: string,
  databasePath: string
): Promise<PostRequestItem> => {
  const [detection] = await getDataFromAccessDatabase<Detection>({
    driverPath,
    databasePath,
    sql: `SELECT TOP 1 * FROM detections WHERE szIDsWheel ='${record.zh}' AND tmnow BETWEEN #${startDate}# AND #${endDate}# ORDER BY tmnow DESC`,
  });

  if (!detection) {
    throw `未找到轴号[${record.zh}]的detections记录`;
  }

  const user = detection.szUsername || "";
  let detectionDatas: DetectionData[] = [];
  let LW_TFLAW_PLACE = "";
  let LW_TFLAW_TYPE = "";
  let LW_TVIEW = "";

  switch (detection.szResult) {
    case "故障":
    case "有故障":
    case "疑似故障":
      LW_TFLAW_PLACE = "车轴";
      LW_TFLAW_TYPE = "裂纹";
      LW_TVIEW = "人工复探";
      detectionDatas = await getDataFromAccessDatabase<DetectionData>({
        driverPath,
        databasePath,
        sql: `SELECT * FROM detections_data WHERE opid ='${detection.szIDs}'`,
      });
      break;
    default:
  }

  detectionDatas.forEach((detectionData) => {
    switch (detectionData.nChannel) {
      case 0:
        LW_TFLAW_PLACE = "穿透";
        break;
      case 1:
      case 2:
        LW_TFLAW_PLACE = "卸荷槽";
        break;
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        LW_TFLAW_PLACE = "轮座";
        break;
    }
  });

  return {
    PJ_JXID: detection.szIDs,
    SB_SN,
    PJ_TAG: "0", // 设备工作状态(开始检修1/结束检修0检修前后更新此标志)
    PJ_ZH: record.zh, // 轴号
    PJ_XH: detection.szWHModel || "", // 轴型
    PJ_ZZRQ: record.PJ_ZZRQ, // 制造日期
    PJ_ZZDW: record.PJ_ZZDW, // 制造单位
    PJ_SN: record.dh, // 从HMIS获取的唯一ID(记录流水号)
    PJ_JXRQ: formatDate(detection.tmnow), // 检修日期(最近更新PJ_TAG的时间)
    CZCTZ: user, // 车轴穿透左(人员签名)
    CZCTY: user, // 车轴穿透右(人员签名)
    LZXRBZ: user, // 轮座镶入部左(人员签名)
    LZXRBY: user, // 轮座镶入部右(人员签名)
    XHCZ: user, // 卸荷槽左(人员签名)
    XHCY: user, // 卸荷槽右(人员签名)
    LW_TFLAW_PLACE, // 缺陷部位
    LW_TFLAW_TYPE, // 缺陷类型
    LW_TVIEW, // 处理意见
    PJ_SCZZRQ: formatDate(record.PJ_SCZZRQ), // 首次组装日期
    PJ_SCZZDW: record.PJ_SCZZDW, // 首次组装单位
    PJ_MCZZRQ: formatDate(record.PJ_MCZZRQ), // 末次组装日期
    PJ_MCZZDW: record.PJ_MCZZDW, // 末次组装单位
    LW_CZCTZ: user, // 左穿透
    LW_CZCTY: user, // 右穿透
    LW_LZXRBZ: user, // 左轮座
    LW_LZXRBY: user, // 右轮座
    LW_XHCZ: user, // 左轴颈
    LW_XHCY: user, // 右轴颈
  };
};
