import type { QuartorData } from "#main/features/mdb/types";
import { mapGroupBy } from "@yotulee/run";
import { divideBy10 } from "./math";

interface RecordMetaData {
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

const flawsToMetaData = (flaws: QuartorData[]): RecordMetaData => {
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

export const resolveCHR502 = (flaws: QuartorData[]) => {
  const opidToFlaws = mapGroupBy(flaws, (flaw) => flaw.opid);

  const attenMap = new Map<string, RecordMetaData>();

  for (const [opid, flaws] of opidToFlaws) {
    if (opid === null) continue;

    attenMap.set(opid, flawsToMetaData(flaws));
  }

  return { attenMap };
};
