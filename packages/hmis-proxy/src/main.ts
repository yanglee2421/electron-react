import type { ServerType } from "@hono/node-server";
import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import dayjs from "dayjs";
import { createFactory } from "hono/factory";
import { z } from "zod";

interface Item {
  //单号
  DH: string;
  //轴号
  ZH: string;
  //轴型
  ZX: string;
  //收入单位
  SRDW: string;
  //收入原因
  SRYY: string;
  //车轴制造单位
  CZZZDW: string;
  //车轴制造日期
  CZZZRQ: string;
  //首次组装单位
  SCZZDW: string;
  //首次组装日期
  SCZZRQ: string;
  //末次组装单位
  MCZZDW: string;
  //末次组装日期
  MCZZRQ: string;
  //左轴
  ZZC: boolean;
  //右轴承
  YZC: boolean;
}

export const createServer = (port: number): ServerType => {
  const schema = z.object({
    dh: z.string(),
    zh: z.string(),
  });

  const factory = createFactory();
  const heartbeatHandler = factory.createHandlers((c) => {
    return c.json({ code: 200, message: "ok" });
  });
  const handler = factory.createHandlers(zValidator("json", schema), (c) => {
    const { dh, zh } = c.req.valid("json");
    const date = dayjs().format("YYYY-MM-DD");
    const items: Item[] = [];

    if (dh) {
      items.push({
        DH: dh,
        ZH: "38254",
        ZX: "RD2",
        SRDW: "003",
        SRYY: "",
        CZZZDW: "005",
        CZZZRQ: date,
        SCZZDW: "009",
        SCZZRQ: date,
        MCZZDW: "007",
        MCZZRQ: date,
        ZZC: false,
        YZC: false,
      });

      return c.json(items);
    }

    if (zh) {
      items.push(
        {
          DH: "DH001",
          ZH: zh,
          ZX: "RD2",
          SRDW: "003",
          SRYY: "",
          CZZZDW: "005",
          CZZZRQ: date,
          SCZZDW: "009",
          SCZZRQ: date,
          MCZZDW: "007",
          MCZZRQ: date,
          ZZC: false,
          YZC: false,
        },
        {
          DH: "DH002",
          ZH: zh,
          ZX: "RE2B",
          SRDW: "001",
          SRYY: "",
          CZZZDW: "002",
          CZZZRQ: date,
          SCZZDW: "003",
          SCZZRQ: date,
          MCZZDW: "004",
          MCZZRQ: date,
          ZZC: true,
          YZC: true,
        },
      );

      return c.json(items);
    }

    throw new Error("dh或zh必须提供其中至少一个");
  });

  const hmis = factory
    .createApp()
    .basePath("/hmis")
    .post("/work", ...handler)
    .post("/heartbeat", ...heartbeatHandler);

  return serve({
    fetch: hmis.fetch,
    port,
  });
};
