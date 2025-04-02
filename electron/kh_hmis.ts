// 康华 安康

import { net } from "electron";
import {
  getDetectionDatasByOPID,
  getDetectionByZH,
  log,
  getCorporation,
} from "./lib";
import dayjs from "dayjs";
import { URL } from "node:url";
import * as consts from "@/lib/constants";
import type { DatabaseBaseParams } from "@/api/database_types";

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
  const body = JSON.stringify({
    mesureId: request.barCode,
  });
  log(`请求数据[${url.href}]:${body}`);
  const res = await net.fetch(url.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
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
  const url = new URL(`http://${request.host}/api/lzdx_csbtsj_tsjg/save`);
  const body = JSON.stringify(request.data);
  log(`请求数据[${url.href}]:${body}`);
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

type QXDataParams = {
  mesureid: string;
  zh: string;
  testdatetime: string;
  testtype: "超声波";
  btcw: "1";
  tsr: string;
  tsgz: string;
  tszjy: string;
  tsysy: string;
  gzmc: "裂纹";
  clff: "人工复探";
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
  bz: "";
};

type SaveQXDataParams = {
  host: string;
  data: QXDataParams;
};

export const saveQXData = async (params: SaveQXDataParams) => {
  const url = new URL(`http://${params.host}/api/lzdx_csbtsj_whzy_tsjgqx/save`);
  const body = JSON.stringify(params.data);
  log(`请求数据[${url.href}]:${body}`);
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

export type SaveDataParams = DatabaseBaseParams & {
  host: string;
  dh: string;
  zh: string;
  date: string;
};

export const saveData = async (params: SaveDataParams) => {
  const startDate = dayjs(params.date)
    .startOf("day")
    .format(consts.DATE_FORMAT_DATABASE);
  const endDate = dayjs(params.date)
    .endOf("day")
    .format(consts.DATE_FORMAT_DATABASE);

  const detection = await getDetectionByZH({
    driverPath: params.driverPath,
    databasePath: params.databasePath,
    zh: params.zh,
    startDate,
    endDate,
  });

  const corporation = await getCorporation({
    driverPath: params.driverPath,
    databasePath: params.databasePath,
  });

  const JCJG = detection.szResult === "合格" ? "1" : "0";

  const basicBody: PostRequestItem = {
    mesureId: params.dh,
    ZH: params.zh,
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

  await postFn({
    data: basicBody,
    host: params.host,
  });

  if (JCJG === "1") return;

  const detectionDatas = await getDetectionDatasByOPID({
    driverPath: params.driverPath,
    databasePath: params.databasePath,
    opid: detection.szIDs,
  });

  const qxBody: QXDataParams = {
    mesureid: params.dh,
    zh: params.zh,
    testdatetime: dayjs(detection.tmnow).format("YYYY-MM-DD HH:mm:ss"),
    testtype: "超声波",
    btcw: "车轴",
    tsr: detection.szUsername || "",
    tsgz: detection.szResult || "",
    tszjy: detection.szUsername || "",
    tsysy: detection.szResult || "",
    gzmc: "裂纹",
    clff: "人工复探",
    // qxlzzdmjlnc: "",
    // qxlzzdmjlwc: "",
    // qxlzydmjlnc: "",
    // qxlzydmjlwc: "",
    // qxlzzlwcnc: "",
    // qxlzzlwcwc: "",
    // qxlzylwcnc: "",
    // qxlzylwcwc: "",
    // qxlzzlwsnc: "",
    // qxlzzlwswc: "",
    // qxlzylwsnc: "",
    // qxlzylwswc: "",
    // qxzjzdmjlzj: "",
    // qxzjzdmjlzs: "",
    // qxzjydmjlzj: "",
    // qxzjydmjlzs: "",
    // qxzjzlwczj: "",
    // qxzjzlwczs: "",
    // qxzjylwczj: "",
    // qxzjylwczs: "",
    // qxzjzlwszj: "",
    // qxzjzlwszs: "",
    // qxzjylwszj: "",
    // qxzjylwszs: "",
    // qxclzlwcz: "0",
    // qxclzlwcy: "0",
    // qxclylwcz: "0",
    // qxclylwcy: "0",
    bz: "",
  };
};
