// 成都北 华兴致远

import { net } from "electron";
import { throwError } from "./lib";

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
  ip: string;
  port: string;
};

export const getFn = async (request: GetRequest) => {
  const url = new URL(
    `http://${request.ip}:${request.port}/lzjx/dx/csbts/device_api/csbts/api/getDate`
  );
  url.searchParams.set("type", "csbts");
  url.searchParams.set("param", request.barCode);
  const res = await net.fetch(url.href, { method: "GET" });
  if (!res.ok) {
    throwError("接口状态异常:" + res.statusText);
  }
  const data: GetResponse = await res.json();
  return data;
};

export type PostRequest = {
  data: {
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
  }[];
  ip: string;
  port: string;
};

export type PostResponse = {
  code: "200";
  msg: "数据上传成功";
};

export const postFn = async (request: PostRequest) => {
  const url = new URL(
    `http://${request.ip}:${request.port}/lzjx/dx/csbts/device_api/csbts/api/saveData`
  );
  url.searchParams.set("type", "csbts");
  const res = await net.fetch(url.href, {
    method: "POST",
    body: JSON.stringify(request.data),
  });
  if (!res.ok) {
    throwError("接口状态异常:" + res.statusText);
  }
  const data: PostResponse = await res.json();
  return data;
};
