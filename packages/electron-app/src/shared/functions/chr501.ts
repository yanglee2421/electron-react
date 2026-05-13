import type { Detecotor, VerifyData } from "#main/features/mdb/types";
import { mapGroupBy } from "@yotulee/run";
import * as mathjs from "mathjs";
import { of } from "./array";
import { calculateXHCFlaws } from "./flawDetection";
import { divideBy10 } from "./math";

const LZ_FLAW_SPACE = 7;

const resolveLZFlaws = (flaws: VerifyData[]) => {
  let latestX = Number.NEGATIVE_INFINITY;

  const resolvedFlaws = flaws
    .toSorted((a, b) => a.fltValueX - b.fltValueX)
    .reduce<VerifyData[]>((group, flaw) => {
      if (flaw.fltValueX > latestX + LZ_FLAW_SPACE) {
        latestX = flaw.fltValueX;
        group.push(flaw);
      }

      return group;
    }, []);

  return resolvedFlaws;
};

const listToMap = <TItem>(flaws: TItem[], start = 1): Map<number, TItem> => {
  return flaws.reduce((map, flaw, index) => {
    map.set(index + start, flaw);
    return map;
  }, new Map<number, TItem>());
};

const channelKey = (nBoard: number, nChannel: number) => {
  return `${nBoard}-${nChannel}`;
};

const mathFormat = (value: number, enabled = false) => {
  if (!enabled) {
    return value ? "✓" : "";
  }

  return mathjs.format(value, {
    notation: "fixed",
    precision: 0,
  });
};

const mathTs = (dbSub: number, atten?: number) => {
  if (!atten) {
    return "";
  }

  return mathjs.format(
    mathjs.divide(
      mathjs.add(mathjs.bignumber(dbSub), mathjs.bignumber(atten)),
      mathjs.bignumber(10),
    ),
    {
      notation: "fixed",
      precision: 1,
    },
  );
};

interface DetectorInfo {
  zsj: string;
  bc: string;
  jy: string;
  ts: string;
  place: string;
  direction: string;
}

interface FlawInfo {
  value: string;
}

export const resolveCHR501 = (flaws: VerifyData[], detectors: Detecotor[]) => {
  const detectorGroup = mapGroupBy(detectors, (detector) =>
    channelKey(detector.nBoard, detector.nChannel),
  );
  const flawGroup = mapGroupBy(flaws, (flaw) => {
    return channelKey(flaw.nBoard, flaw.nChannel);
  });

  const detectorInfo = new Map<string, DetectorInfo>();

  for (const [key, [detector]] of detectorGroup) {
    if (!detector) continue;

    const flaw = flawGroup.get(key)?.at(0) || null;
    const flawAtten = flaw ? divideBy10(flaw.nAtten) : "";

    detectorInfo.set(key, {
      zsj: divideBy10(detector.nWAngle),
      bc: divideBy10(detector.nDBSub),
      jy: flawAtten,
      ts: mathTs(detector.nDBSub, flaw?.nAtten),
      place: detector.szName,
      direction: detector.nBoard === 0 ? "左" : "右",
    });
  }

  const l01Flaws = resolveLZFlaws(flawGroup.get("0-3") || []);
  const l02Flaws = resolveLZFlaws(flawGroup.get("0-4") || []);
  const lA3Flaws = resolveLZFlaws(flawGroup.get("0-2") || []);
  const r01Flaws = resolveLZFlaws(flawGroup.get("1-3") || []);
  const r02Flaws = resolveLZFlaws(flawGroup.get("1-4") || []);
  const rA3Flaws = resolveLZFlaws(flawGroup.get("1-2") || []);

  const l01Group = listToMap(l01Flaws);
  const l02Group = listToMap(l02Flaws, 12 - l02Flaws.length);
  const lA3Group = listToMap(lA3Flaws);
  const r01Group = listToMap(r01Flaws);
  const r02Group = listToMap(r02Flaws, 12 - r02Flaws.length);
  const rA3Group = listToMap(rA3Flaws);

  const flawInfo = new Map<string, FlawInfo[]>();
  const of13 = of(13);

  for (const [key, flaws] of flawGroup) {
    switch (key) {
      // CT
      case "0-0":
      case "1-0":
        flawInfo.set(
          key,
          flaws.map((flaw) => {
            return {
              value: mathjs.format(flaw.fltValueX, {
                notation: "fixed",
                precision: 0,
              }),
            };
          }),
        );
        break;
      // A01
      case "0-1":
      case "1-1":
        flawInfo.set(
          key,
          calculateXHCFlaws(flaws).map((flaw) => {
            return {
              value: mathjs.format(flaw.fltValueX, {
                notation: "fixed",
                precision: 0,
              }),
            };
          }),
        );
        break;
      // A03
      case "0-2":
        flawInfo.set(
          key,
          of13.map((no) => {
            const flaw = lA3Group.get(no);

            return {
              value: flaw ? mathFormat(flaw.fltValueX) : "",
            };
          }),
        );
        break;
      case "1-2":
        flawInfo.set(
          key,
          of13.map((no) => {
            const flaw = rA3Group.get(no);

            return {
              value: flaw ? mathFormat(flaw.fltValueX) : "",
            };
          }),
        );
        break;
      // 01
      case "0-3":
        flawInfo.set(
          key,
          of13.map((no) => {
            const flaw = l01Group.get(no);

            return {
              value: flaw ? mathFormat(flaw.fltValueX) : "",
            };
          }),
        );
        break;
      case "1-3":
        flawInfo.set(
          key,
          of13.map((no) => {
            const flaw = r01Group.get(no);

            return {
              value: flaw ? mathFormat(flaw.fltValueX) : "",
            };
          }),
        );
        break;
      // 02
      case "0-4":
        flawInfo.set(
          key,
          of13.map((no) => {
            const flaw = l02Group.get(no);

            return {
              value: flaw ? mathFormat(flaw.fltValueX) : "",
            };
          }),
        );
        break;
      case "1-4":
        flawInfo.set(
          key,
          of13.map((no) => {
            const flaw = r02Group.get(no);

            return {
              value: flaw ? mathFormat(flaw.fltValueX) : "",
            };
          }),
        );
        break;
      default:
        continue;
    }
  }

  return {
    detectorInfo,
    flawInfo,
  };
};
