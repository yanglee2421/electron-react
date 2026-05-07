import type { Detecotor } from "#main/features/mdb/types";
import * as mathjs from "mathjs";

const divideBy10 = (value?: number) => {
  if (typeof value !== "number") {
    return "";
  }

  const val = mathjs.divide(mathjs.bignumber(value), mathjs.bignumber(10));

  return mathjs.format(val, { notation: "fixed", precision: 1 });
};

export class DetectorQuery {
  private detectors: Detecotor[];

  constructor(detectors: Detecotor[]) {
    this.detectors = detectors;
  }

  private szName(name: string) {
    const rows = this.detectors.filter((detector) => detector.szName === name);
    const [row] = rows;

    if (!row) {
      return null;
    }

    return {
      bc: divideBy10(row?.nDBSub),
      zsj: divideBy10(row?.nWAngle),
    };
  }

  lCT() {
    return this.szName("左穿透");
  }
  lA01() {
    return this.szName("左A01");
  }
  lA02() {
    return this.szName("左A02");
  }
  lA03() {
    return this.szName("左A03");
  }
  l01() {
    return this.szName("左01");
  }
  l02() {
    return this.szName("左02");
  }
  rCT() {
    return this.szName("右穿透");
  }
  rA01() {
    return this.szName("右A01");
  }
  rA02() {
    return this.szName("右A02");
  }
  rA03() {
    return this.szName("右A03");
  }
  r01() {
    return this.szName("右01");
  }
  r02() {
    return this.szName("右02");
  }
}
