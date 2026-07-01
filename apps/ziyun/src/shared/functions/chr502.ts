import type { QuartorData } from "#main/features/mdb/types";
import { mapGroupBy } from "@yotulee/run";
import * as mathjs from "mathjs";
import { divideBy10 } from "./math";

interface ChannelMeta {
  lct: string;
  rct: string;
  lxh: string;
  rxh: string;
  l01: string;
  r01: string;
  l02: string;
  r02: string;
  la3: string;
  ra3: string;
}

const flawsToMetaData = (flaws: QuartorData[]): ChannelMeta => {
  return flaws.reduce(
    (meta, flaw) => {
      const key = `${flaw.nBoard}-${flaw.nChannel}`;

      switch (key) {
        case "0-0":
          meta.lct = divideBy10(flaw.nAtten);
          break;
        case "0-1":
          meta.lxh = divideBy10(flaw.nAtten);
          break;
        case "0-2":
          meta.la3 = divideBy10(flaw.nAtten);
          break;
        case "0-3":
          meta.l01 = divideBy10(flaw.nAtten);
          break;
        case "0-4":
          meta.l02 = divideBy10(flaw.nAtten);
          break;
        case "1-0":
          meta.rct = divideBy10(flaw.nAtten);
          break;
        case "1-1":
          meta.rxh = divideBy10(flaw.nAtten);
          break;
        case "1-2":
          meta.ra3 = divideBy10(flaw.nAtten);
          break;
        case "1-3":
          meta.r01 = divideBy10(flaw.nAtten);
          break;
        case "1-4":
          meta.r02 = divideBy10(flaw.nAtten);
          break;
        default:
      }

      return meta;
    },
    {
      lct: "",
      rct: "",
      lxh: "",
      rxh: "",
      l01: "",
      r01: "",
      l02: "",
      r02: "",
      la3: "",
      ra3: "",
    },
  );
};

export const calculateMaxDiff = (...args: string[]) => {
  const nums = args.map((arg) => Number.parseFloat(arg));

  if (nums.length === 0) {
    return "";
  }

  const hasNan = nums.some((num) => Number.isNaN(num));

  if (hasNan) return "";

  const max = mathjs.max(nums);
  const min = mathjs.min(nums);

  return mathjs.format(mathjs.abs(mathjs.subtract(max, min)), {
    notation: "fixed",
    precision: 1,
  });
};

interface ResultInfo {
  xhc: string;
  a3: string;
  ch01: string;
  ch02: string;
  ct: string;
}

export const calculateResult = (left: string, right: string): string => {
  const leftNum = Number.parseFloat(left);
  const rightNum = Number.parseFloat(right);

  if (Number.isNaN(leftNum)) {
    return "";
  }

  if (Number.isNaN(rightNum)) {
    return "";
  }

  const valid = mathjs.smallerEq(leftNum, 6) && mathjs.smallerEq(rightNum, 6);

  return valid ? "合格" : "不合格";
};

export const resolveCHR502 = (flaws: QuartorData[]) => {
  const opidToFlaws = mapGroupBy(flaws, (flaw) => flaw.opid);
  const attenMap = new Map<string, ChannelMeta>();

  for (const [opid, flaws] of opidToFlaws) {
    if (opid === null) continue;

    attenMap.set(opid, flawsToMetaData(flaws));
  }

  const attenValues = [...attenMap.values()];

  const maxDiffInfo: ChannelMeta = {
    lct: calculateMaxDiff(...attenValues.map((meta) => meta.lct)),
    rct: calculateMaxDiff(...attenValues.map((meta) => meta.rct)),
    lxh: calculateMaxDiff(...attenValues.map((meta) => meta.lxh)),
    rxh: calculateMaxDiff(...attenValues.map((meta) => meta.rxh)),
    l01: calculateMaxDiff(...attenValues.map((meta) => meta.l01)),
    r01: calculateMaxDiff(...attenValues.map((meta) => meta.r01)),
    l02: calculateMaxDiff(...attenValues.map((meta) => meta.l02)),
    r02: calculateMaxDiff(...attenValues.map((meta) => meta.r02)),
    la3: calculateMaxDiff(...attenValues.map((meta) => meta.la3)),
    ra3: calculateMaxDiff(...attenValues.map((meta) => meta.ra3)),
  };

  const resultInfo: ResultInfo = {
    ct: calculateResult(maxDiffInfo.lct, maxDiffInfo.rct),
    xhc: calculateResult(maxDiffInfo.lxh, maxDiffInfo.rxh),
    ch01: calculateResult(maxDiffInfo.l01, maxDiffInfo.r01),
    ch02: calculateResult(maxDiffInfo.l02, maxDiffInfo.r02),
    a3: calculateResult(maxDiffInfo.la3, maxDiffInfo.ra3),
  };

  return { attenMap, maxDiffInfo, resultInfo };
};
