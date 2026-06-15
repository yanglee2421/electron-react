import addon from "@yanglee2421/cpp-addon";
import dayjs from "dayjs";
import type { AutoInputToVCParams } from "./types";

export class Cmd {
  autoInputToVCNaive(data: AutoInputToVCParams) {
    return addon.autoInputToVC(
      data.zx,
      data.zh,
      data.czzzdw,
      data.sczzdw,
      data.mczzdw,
      dayjs(data.czzzrq).format("YYYYMM"),
      dayjs(data.sczzrq).format("YYYYMMDD"),
      dayjs(data.mczzrq).format("YYYYMMDD"),
      +data.ztx,
      +data.ytx,
    );
  }
  isRunAsAdmin() {
    return addon.isRunAsAdmin();
  }
}
