// 成都北 华兴致远

import { net } from "electron";
import { getDataFromAccessDatabase, log } from "./lib";
import dayjs from "dayjs";
import { URL } from "node:url";
import type {
  Detection,
  DetectionData,
  Verify,
  VerifyData,
  DatabaseBaseParams,
} from "@/api/database_types";

export type GetResponse = {
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
    ldmzrq: "20 18-04-13";
    ldmzdw: "623";
  };
  code: 200;
  msg: "success";
};

export type GetRequest = {
  barCode: string;
  host: string;
};

export const getFn = async (request: GetRequest) => {
  const url = new URL(`http://${request.host}/api/lzdx_csbtsj_get/get`);
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", request.barCode);
  log(`请求数据:${url.href}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mesureId: request.barCode,
    }),
  });
  if (!res.ok) {
    throw `接口异常[${res.status}]:${res.statusText}`;
  }
  const data: GetResponse = await res.json();
  log(`返回数据:${JSON.stringify(data)}`);
  if (data.code !== 200) {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};

export type PostRequestItem = {
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
};

export type PostRequest = {
  data: PostRequestItem;
  host: string;
};

export type PostResponse = {
  code: 200;
  msg: "success";
};

export const postFn = async (request: PostRequest) => {
  const url = new URL(`http://${request.host}/api/saveData`);
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
  if (data.code !== 200) {
    throw `接口异常[${data.code}]:${data.msg}`;
  }
  return data;
};

type Record = {
  dh: string;
  zh: string;
};

export type SaveDataParams = DatabaseBaseParams & {
  host: string;
  records: {
    dh: string;
    zh: string;
  };
};

export const recordToSaveDataParams = async (
  record: Record,
  eq_ip: string,
  eq_bh: string,
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
  let TFLAW_PLACE = "";
  let TFLAW_TYPE = "";
  let TVIEW = "";

  switch (detection.szResult) {
    case "故障":
    case "有故障":
    case "疑似故障":
      TFLAW_PLACE = "车轴";
      TFLAW_TYPE = "裂纹";
      TVIEW = "人工复探";
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
        TFLAW_PLACE = "穿透";
        break;
      case 1:
      case 2:
        TFLAW_PLACE = "卸荷槽";
        break;
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        TFLAW_PLACE = "轮座";
        break;
    }
  });

  return {
    eq_ip,
    eq_bh,
    dh: record.dh,
    zx: detection.szWHModel || "",
    zh: record.zh,
    TSFF: "超声波",
    TSSJ: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
    TFLAW_PLACE,
    TFLAW_TYPE,
    TVIEW,
    CZCTZ: user,
    CZCTY: user,
    LZXRBZ: user,
    LZXRBY: user,
    XHCZ: user,
    XHCY: user,
    TSZ: user,
    TSZY: user,
    CT_RESULT: detection.szResult || "",
  };
};
