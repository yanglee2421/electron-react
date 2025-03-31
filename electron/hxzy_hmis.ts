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
    }
  ];
};

export type GetRequest = {
  barCode: string;
  host: string;
};

export const getFn = async (request: GetRequest) => {
  const url = new URL(
    `http://${request.host}/lzjx/dx/csbts/device_api/csbts/api/getDate`
  );
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
  EQ_IP: string; // 设备IP
  EQ_BH: string; // 设备编号
  GD: string; // 股道号
  dh: string; // 扫码单号
  zx: string; // RE2B
  zh: string; // 03684
  TSFF: string;
  TSSJ: string;
  TFLAW_PLACE: string; // 缺陷部位
  TFLAW_TYPE: string; // 缺陷类型
  TVIEW: string; // 处理意见
  CZCTZ: string; // 左穿透签章
  CZCTY: string; // 右穿透签章
  LZXRBZ: string; // 左轮座签章
  LZXRBY: string; // 右轮座签章
  XHCZ: string; // 左轴颈签章
  XHCY: string; // 右轴颈签章
  TSZ: string; // 探伤者左
  TSZY: string; // 探伤者右
  CT_RESULT: string; // 合格
};

export type PostRequest = {
  data: PostRequestItem[];
  host: string;
};

export type PostResponse = {
  code: "200";
  msg: "数据上传成功";
};

export const postFn = async (request: PostRequest) => {
  const url = new URL(
    `http://${request.host}/lzjx/dx/csbts/device_api/csbts/api/saveData`
  );
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
  if (data.code !== "200") {
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
  gd: string;
  records: {
    dh: string;
    zh: string;
  }[];
};

export const recordToSaveDataParams = async (
  record: Record,
  EQ_IP: string,
  EQ_BH: string,
  GD: string,
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
    EQ_IP,
    EQ_BH,
    GD,
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

export type UploadVerifiesParams = DatabaseBaseParams & {
  host: string;
  id: string;
};

export const idToUploadVerifiesData = async (
  id: string,
  driverPath: string,
  databasePath: string
) => {
  const [verifies] = await getDataFromAccessDatabase<Verify>({
    databasePath,
    driverPath,
    sql: `SELECT * FROM verifies WHERE szIDs ='${id}'`,
  });

  if (!verifies) {
    throw `未找到ID[${id}]的verifies记录`;
  }

  const verifiesData = await getDataFromAccessDatabase<VerifyData>({
    databasePath,
    driverPath,
    sql: `SELECT * FROM verifies_data WHERE opid ='${verifies.szIDs}'`,
  });

  return {
    verifies,
    verifiesData,
  };
};
