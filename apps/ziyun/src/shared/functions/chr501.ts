import type { Detecotor } from "#main/features/mdb/types";
import { of } from "#shared/functions/array";
import { mapGroupBy } from "@yotulee/run";
import * as mathjs from "mathjs";

interface FlawLike {
  nBoard: number;
  nChannel: number;
  nAtten: number;
  fltValueX: number;
}

export interface ChannelData {
  name: string;
  zsj: string;
  bc: string;
  jy: string;
  ts: string;
  flaws: string[];
}

export const divide10 = (value: number, precision = 0) => {
  return mathjs.format(
    mathjs.divide(mathjs.bignumber(value), mathjs.bignumber(10)),
    { precision, notation: "fixed" },
  );
};

export const calcTs = (bc: string, jy: string) => {
  if (!bc) {
    return "";
  }

  if (!jy) {
    return "";
  }

  return mathjs.format(mathjs.add(mathjs.bignumber(bc), mathjs.bignumber(jy)), {
    precision: 1,
    notation: "fixed",
  });
};

const findFlawsByFirst = (originalFlaws: number[], flaw1: number) => {
  const flaws1 = [flaw1];
  const excepted2 = flaw1 + 10;
  const flaw2 = originalFlaws
    .filter((i) => !flaws1.includes(i))
    .toSorted((a, b) => Math.abs(a - excepted2) - Math.abs(b - excepted2))
    .at(0);

  if (!flaw2) {
    return flaws1;
  }

  const flaws2 = [flaw1, flaw2];
  const excepted3 = flaw2 + 5;
  const flaw3 = originalFlaws
    .filter((i) => !flaws2.includes(i))
    .toSorted((a, b) => Math.abs(a - excepted3) - Math.abs(b - excepted3))
    .at(0);

  if (!flaw3) {
    return flaws2;
  }

  return [flaw1, flaw2, flaw3];
};

const calcXhcFlaws = (flaws: number[]) => {
  if (flaws.length < 4) {
    return flaws;
  }

  let result: number[] = [];

  for (const flaw of flaws) {
    const xhcFlaws = findFlawsByFirst(flaws, flaw);

    if (xhcFlaws.length === 3) {
      return xhcFlaws;
    }

    if (xhcFlaws.length > result.length) {
      result = xhcFlaws;
    }
  }

  return result;
};

const fixed = (value: number) => {
  return mathjs.format(value, { notation: "fixed", precision: 0 });
};

export const calcFlaws = (datas: FlawLike[], channel: number): string[] => {
  const numberifyDatas = datas.map((i) => Number.parseInt(fixed(i.fltValueX)));
  const flaws = [...new Set(numberifyDatas)].toSorted((a, b) => a - b);

  switch (channel) {
    case 0:
      return flaws.map((i) => i.toString());
    case 1:
      return calcXhcFlaws(flaws).map((i) => i.toString());
    case 2:
      return flaws.map((i) => i.toString());
    case 3:
      return flaws.map((i) => i.toString());
    case 4:
      return [
        ...of(11 - flaws.length).map(() => ""),
        ...flaws.map((i) => i.toString()),
      ];
    default:
      return [];
  }
};

export const resolvedFlaws = (datas: FlawLike[], detectors: Detecotor[]) => {
  const flawGroup = mapGroupBy(datas, (d) => `${d.nBoard}-${d.nChannel}`);
  const detectorGroup = mapGroupBy(
    detectors,
    (d) => `${d.nBoard}-${d.nChannel}`,
  );
  const result = new Map<string, ChannelData>();

  for (let board = 0; board < 2; board++) {
    for (let channel = 0; channel < 5; channel++) {
      const flaws = flawGroup.get(`${board}-${channel}`) || [];
      const flaw = flaws?.at(0);
      const detector = detectorGroup.get(`${board}-${channel}`)?.at(0);
      const name = detector?.szName || "";
      const zsj =
        typeof detector?.nWAngle === "number"
          ? divide10(detector.nWAngle, 1)
          : "";
      const bc =
        typeof detector?.nDBSub === "number"
          ? divide10(detector.nDBSub, 1)
          : "";
      const jy =
        typeof flaw?.nAtten === "number" ? divide10(flaw.nAtten, 1) : "";
      const ts = calcTs(bc, jy);

      result.set(`${board}-${channel}`, {
        name,
        zsj,
        bc,
        jy,
        ts,
        flaws: calcFlaws(flaws, channel),
      });
    }
  }

  return result;
};
