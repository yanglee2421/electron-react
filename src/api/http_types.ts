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

export type PostRequest = [
  {
    eq_ip: "设备IP";
    eq_bh: "设备编号";
    dh: "扫码单号";
    zx: "RE2B";
    zh: "03684";
    TFLAW_PLACE: "缺陷部位";
    TFLAW_TYPE: "缺陷类型";
    TVIEW: "处理意见";
    CZCTZ: "左穿透签章";
    CZCTY: "右穿透签章";
    LZXRBZ: "左轮座签章";
    LZXRBY: "右轮座签章";
    XHCZ: "左轴颈签章";
    XHCY: "右轴颈签章";
    TSZ: "探伤者左";
    TSZY: "探伤者右";
    CT_RESULT: "合格";
  }
];

export type PostResponse = {
  code: "200";
  msg: "数据上传成功";
};
