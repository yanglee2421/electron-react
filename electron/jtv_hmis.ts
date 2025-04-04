// 成都北 华兴致远

import { net } from "electron";
import { getDetectionDatasByOPID, getDetectionByZH, log } from "./lib";
import dayjs from "dayjs";
import { URL } from "node:url";
import type {
  DetectionData,
  DatabaseBaseParams,
} from "#/electron/database_types";

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
  unitCode: string;
};

export const getFn = async (request: GetRequest) => {
  const url = new URL(`http://${request.host}/api/getData`);
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", [request.barCode, request.unitCode].join(","));
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
  eq_ip: string; // 设备IP
  eq_bh: string; // 设备编号
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
  records: {
    dh: string;
    zh: string;
  }[];
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
  const detection = await getDetectionByZH({
    driverPath,
    databasePath,
    zh: record.zh,
    startDate,
    endDate,
  });

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
      detectionDatas = await getDetectionDatasByOPID({
        databasePath,
        driverPath,
        opid: detection.szIDs,
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
